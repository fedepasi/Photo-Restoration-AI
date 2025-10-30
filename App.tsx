import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import StepCard from './components/StepCard';
import ExamplePreview from './components/ExamplePreview';
import { RestorationStep } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { generateRestorationPlan, executeRestorationStep } from './services/geminiService';
import { sendLog } from './services/loggingService';
import { SparklesIcon, RefreshIcon, DownloadIcon, CheckCircleIcon, SpinnerIcon, CloseIcon } from './components/Icons';

const MAX_USES = 100;
const CONTACT_EMAIL = "info@federicopasinetti.it";

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [steps, setSteps] = useState<RestorationStep[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usesLeft, setUsesLeft] = useState<number>(MAX_USES);
  const [modalImage, setModalImage] = useState<string | null>(null);


  const isRestorationComplete = steps.length > 0 && steps[steps.length - 1].status === 'completed';

  useEffect(() => {
    // Fetch remaining uses from server
    const fetchRemainingUses = async () => {
      try {
        const response = await fetch('/api/remaining-uses');
        if (response.ok) {
          const data = await response.json();
          setUsesLeft(data.remainingUses);
        } else {
          console.error('Failed to fetch remaining uses');
          setUsesLeft(0);
        }
      } catch (error) {
        console.error('Error fetching remaining uses:', error);
        setUsesLeft(0);
      }
    };
    fetchRemainingUses();
  }, []);

  const handleImageSelect = (file: File) => {
    resetState(false);
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const resetState = (keepImage = false) => {
    if (!keepImage) {
        setSelectedFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setUserPrompt('');
    }
    setSteps([]);
    setIsProcessing(false);
    setError(null);
  }

  const handleStartRestoration = async () => {
    if (usesLeft <= 0) {
      setError("Non hai più utilizzi a disposizione.");
      return;
    }
    if (!selectedFile) {
      setError("Seleziona prima un'immagine.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSteps([]);

    try {
      // Record usage via API
      const useResponse = await fetch('/api/use-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!useResponse.ok) {
        const errorData = await useResponse.json();
        throw new Error(errorData.error || 'Impossibile registrare l\'utilizzo');
      }

      const useData = await useResponse.json();
      setUsesLeft(useData.remainingUses);

      const { base64, mimeType } = await fileToBase64(selectedFile);
      const plan = await generateRestorationPlan(base64, mimeType, userPrompt);
      
      const initialSteps: RestorationStep[] = plan.map(p => ({
        ...p, status: 'pending', beforeImage: null, afterImage: null,
      }));
      setSteps(initialSteps);

      let currentImageBase64 = base64;
      let currentMimeType = mimeType;
      
      const stepsForLog: RestorationStep[] = JSON.parse(JSON.stringify(initialSteps));

      for (let i = 0; i < initialSteps.length; i++) {
        const beforeImageUrl = `data:${currentMimeType};base64,${currentImageBase64}`;
        stepsForLog[i].beforeImage = beforeImageUrl;
        
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'in-progress', beforeImage: beforeImageUrl } : s));
        
        const resultDataUrl = await executeRestorationStep(currentImageBase64, currentMimeType, initialSteps[i].prompt);
        
        stepsForLog[i].afterImage = resultDataUrl;
        stepsForLog[i].status = 'completed';

        const newBase64 = resultDataUrl.split(',')[1];
        const newMimeType = resultDataUrl.split(';')[0].split(':')[1];
        currentImageBase64 = newBase64;
        currentMimeType = newMimeType;
        
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed', afterImage: resultDataUrl } : s));
      }

      // Invia il log al termine del processo (in background)
      const originalImageDataUrl = `data:${mimeType};base64,${base64}`;
      const finalImageDataUrl = stepsForLog[stepsForLog.length - 1].afterImage!;

      sendLog({
        userPrompt: userPrompt,
        steps: stepsForLog,
        originalImage: originalImageDataUrl,
        finalImage: finalImageDataUrl,
      }).catch(err => {
        console.error('Failed to log execution:', err);
        // Don't throw - logging is non-critical
      });

    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || 'Si è verificato un errore sconosciuto.';
      setError(`Si è verificato un errore: ${errorMessage}`);
      setSteps(prev => prev.map(s => s.status === 'in-progress' ? { ...s, status: 'failed' } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const finalImage = steps[steps.length - 1]?.afterImage;
    if (finalImage) {
        const link = document.createElement('a');
        link.href = finalImage;
        link.download = 'foto-restaurata.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const isLocked = usesLeft <= 0;

  return (
    <div className="min-h-screen font-sans">
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-bold">RetroRestore AI</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-gray-400">
                Utilizzi Rimasti: <span className="font-bold text-green-400">{usesLeft}</span>
            </div>
            <button
              onClick={() => resetState()}
              className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              <RefreshIcon className="w-5 h-5" />
              Nuovo Restauro
            </button>
          </div>
        </header>

        {isLocked ? (
          <div className="text-center p-8 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg">
            <div className="mb-6">
              <SparklesIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Grazie per aver provato RetroRestore AI!</h2>
              <p className="text-gray-300 text-lg mb-2">Hai utilizzato tutte le {MAX_USES} prove gratuite disponibili.</p>
              <p className="text-gray-400 mb-6">Questa è un'app dimostrativa gratuita con utilizzi limitati per tutti gli utenti.</p>
            </div>
            <div className="bg-[#161B22] border border-gray-700 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-gray-300 mb-3">Vuoi sbloccare più restauri o hai bisogno di supporto?</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors duration-300"
              >
                <span>✉️</span>
                Contattami
              </a>
              <p className="text-gray-500 text-sm mt-3">{CONTACT_EMAIL}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column */}
            <div className="w-full lg:w-2/3 space-y-6">
              {steps.length === 0 ? (
                <div className="bg-[#161B22] p-6 rounded-lg border border-gray-700 space-y-6">
                  <div className='text-center mb-4'>
                    <h2 className='text-xl font-semibold'>Dai nuova vita alle tue vecchie foto</h2>
                    <p className='text-gray-400'>Carica un'immagine e lascia che la nostra intelligenza artificiale la restauri, la colori e ne migliori la qualità, passo dopo passo.</p>
                  </div>
                  <ImageUploader onImageSelect={handleImageSelect} imagePreview={imagePreview} disabled={isProcessing} />
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Opzionale: Aggiungi istruzioni specifiche (es. 'La donna ha i capelli biondi e gli occhi azzurri')."
                    className="w-full bg-[#0D1117] border border-gray-600 rounded-md p-3 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    rows={3}
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleStartRestoration}
                    disabled={isProcessing || !selectedFile}
                    className="w-full px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <><SpinnerIcon className="w-5 h-5" /> Elaborazione in corso...</> : 'Restaura Foto'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps.map((step, index) => <StepCard key={index} step={step} stepNumber={index + 1} />)}
                </div>
              )}
               {error && <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">{error}</div>}
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-8 bg-[#161B22] p-4 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-center">Risultato Finale</h2>
                {isRestorationComplete ? (
                    <div className="space-y-4">
                        <div className="flex justify-center mb-2">
                           <div className="px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 bg-green-800 text-green-200">
                            <CheckCircleIcon className="w-4 h-4" />Pronto
                           </div>
                        </div>
                        <img src={steps[steps.length - 1].afterImage!} alt="Risultato Finale" className="rounded-lg w-full" />
                         <button
                            onClick={handleDownload}
                            className="w-full px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center gap-2"
                        >
                           <DownloadIcon className="w-5 h-5" /> Scarica Risultato
                        </button>
                    </div>
                ) : (
                    <div className="aspect-square flex items-center justify-center text-gray-500 text-center">
                        {isProcessing ? "Restauro in corso..." : "La tua immagine finale apparirà qui una volta completato il restauro."}
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!selectedFile && (
            <div className="mt-12 border-t border-gray-700 pt-8">
                 <div className='text-center mb-6'>
                    <h2 className='text-2xl font-semibold'>Guarda la nostra AI in azione</h2>
                    <p className='text-gray-400 mt-2 max-w-2xl mx-auto'>Ecco un esempio di come la nostra tecnologia può trasformare una foto sbiadita e in bianco e nero in un'immagine vibrante e piena di vita. Clicca sulle immagini per ingrandirle.</p>
                  </div>
                <ExamplePreview onImageClick={(src) => setModalImage(src)} />
            </div>
        )}

      </main>
      <footer className="text-center p-4 text-gray-600 text-sm mt-8">
        Realizzato con Google Gemini
      </footer>

      {modalImage && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" 
            onClick={() => setModalImage(null)}
        >
            <button onClick={() => setModalImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
              <CloseIcon className="w-8 h-8" />
            </button>
            <img 
                src={modalImage} 
                className="max-w-full max-h-full object-contain rounded-lg" 
                alt="Vista ingrandita" 
                onClick={(e) => e.stopPropagation()} // Impedisce la chiusura del modale cliccando sull'immagine
            />
        </div>
      )}
    </div>
  );
};

export default App;
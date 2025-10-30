import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface RestorationPlanStep {
  objective: string;
  prompt: string;
}

/**
 * Generates a multi-step restoration plan for a given image.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image.
 * @param userPrompt Optional user instructions.
 * @returns A promise that resolves to an array of restoration steps.
 */
export const generateRestorationPlan = async (
  base64Image: string,
  mimeType: string,
  userPrompt: string
): Promise<RestorationPlanStep[]> => {
  // Use a powerful model for reasoning and creating a plan.
  const model = "gemini-2.5-pro";
  
  const systemInstruction = `Sei un esperto di fotoritocco e restauro fotografico. Il tuo compito è analizzare una foto e creare un piano di restauro dettagliato, passo dopo passo, con l'obiettivo di raggiungere un risultato fotorealistico, come se la foto fosse stata scattata oggi con una fotocamera DSLR di alta qualità.
    Il piano deve essere suddiviso in una serie di direttive chiare. Ogni passo deve avere un "obiettivo" (una breve descrizione in italiano, es. "Rimuovi graffi e pieghe") e una "direttiva" (un prompt dettagliato).
    
    Regole fondamentali:
    1.  **QUALITÀ FOTOREALISTICA**: Punta a un risultato finale indistinguibile da una foto moderna. Nelle direttive, includi dettagli su texture della pelle, illuminazione naturale, resa cromatica accurata e, se appropriato, effetti di lenti come una leggera profondità di campo (bokeh).
    2.  **LOGICA DI RESTAURO**: Crea un piano logico e conciso in 3-4 passaggi. Inizia con le correzioni strutturali (graffi, strappi), poi passa al bilanciamento di luce/contrasto, e infine alla colorazione (se necessario). Evita di creare un passaggio finale separato solo per l'upscaling o la nitidezza.
    3.  **SPECIFICITÀ**: Sii specifico. Invece di "Migliora colori", scrivi direttive come "Adjust the color balance to give the skin tones a natural, warm hue. Enhance the saturation of the background foliage while keeping the subject's clothing colors realistic."
    4.  **ISTRUZIONI UTENTE**: Se l'utente fornisce istruzioni specifiche, incorporale nel piano.
    5.  **LINGUA DELLE DIRETTIVE**: IMPORTANTISSIMO: Il valore del campo 'prompt' in ogni passo DEVE ESSERE SCRITTO IN INGLESE, poiché verrà inviato a un modello di IA per immagini che funziona in modo ottimale con l'inglese. L'obiettivo ('objective') deve rimanere in italiano.
    6.  **OUTPUT**: L'output deve essere solo un array JSON valido, senza testo aggiuntivo o markdown.`;

  const promptParts = [
    {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    },
    {
      text: `Analizza questa immagine e crea un piano di restauro fotorealistico. Istruzioni utente: "${userPrompt || 'Nessuna istruzione specifica.'}"`,
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: promptParts }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              objective: {
                type: Type.STRING,
                description: "Breve descrizione in italiano dell'obiettivo di questo passaggio.",
              },
              prompt: {
                type: Type.STRING,
                description: "La direttiva dettagliata IN INGLESE per l'IA che eseguirà la modifica dell'immagine.",
              },
            },
            required: ["objective", "prompt"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText.startsWith('[') || !jsonText.endsWith(']')) {
        throw new Error('La risposta del modello non è un array JSON valido.');
    }

    const plan = JSON.parse(jsonText);

    if (!Array.isArray(plan) || plan.some(step => !step.objective || !step.prompt)) {
        throw new Error("Il piano di restauro generato non è nel formato corretto.");
    }

    return plan;

  } catch (error) {
    console.error("Errore durante la generazione del piano di restauro:", error);
    throw new Error("Impossibile generare il piano di restauro. Riprova.");
  }
};

/**
 * Executes a single restoration step on an image.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image.
 * @param prompt The prompt detailing the restoration task.
 * @returns A promise that resolves to a data URL (base64) of the modified image.
 */
export const executeRestorationStep = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  // Use the model specialized for image editing.
  const model = "gemini-2.5-flash-image";

  const contents = {
    parts: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: prompt,
      },
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        // Must be an array with a single `Modality.IMAGE` element for image output.
        responseModalities: [Modality.IMAGE],
      },
    });

    // Extract the generated image from the response.
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageData = part.inlineData.data;
        const imageMimeType = part.inlineData.mimeType;
        return `data:${imageMimeType};base64,${base64ImageData}`;
      }
    }

    throw new Error("Nessuna immagine generata nella risposta del modello.");
  } catch (error) {
    console.error("Errore durante l'esecuzione del passaggio di restauro:", error);
    throw new Error("Impossibile generare l'immagine per questo passaggio.");
  }
};
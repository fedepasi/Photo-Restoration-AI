
import React from 'react';
import { RestorationStep, StepStatus } from '../types';
import { CheckCircleIcon, SpinnerIcon, XCircleIcon } from './Icons';

interface StepCardProps {
  step: RestorationStep;
  stepNumber: number;
}

const StatusBadge: React.FC<{ status: StepStatus }> = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1";
  
  if (status === 'completed') {
    return <div className={`${baseClasses} bg-green-800 text-green-200`}><CheckCircleIcon className="w-4 h-4" />Completato</div>;
  }
  if (status === 'in-progress') {
    return <div className={`${baseClasses} bg-blue-800 text-blue-200`}><SpinnerIcon className="w-4 h-4" />In Corso</div>;
  }
  if (status === 'failed') {
    return <div className={`${baseClasses} bg-red-800 text-red-200`}><XCircleIcon className="w-4 h-4" />Fallito</div>;
  }
  return <div className={`${baseClasses} bg-gray-700 text-gray-300`}>In attesa</div>;
};


const StepCard: React.FC<StepCardProps> = ({ step, stepNumber }) => {
  return (
    <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-200">Passaggio {stepNumber}: {step.objective}</h3>
        <StatusBadge status={step.status} />
      </div>
      
      <p className="text-sm text-gray-400">{step.objective}</p>

      {(step.beforeImage || step.afterImage || step.status !== 'pending') && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 text-center">PRIMA</h4>
            {step.beforeImage ? (
              <img src={step.beforeImage} alt={`Prima del passaggio ${stepNumber}`} className="rounded-md w-full aspect-video object-contain bg-black" />
            ) : (
                <div className="rounded-md w-full aspect-video bg-black/50 flex items-center justify-center text-gray-500 text-sm">In attesa</div>
            )}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 text-center">DOPO</h4>
            {step.afterImage ? (
              <img src={step.afterImage} alt={`Dopo il passaggio ${stepNumber}`} className="rounded-md w-full aspect-video object-contain bg-black" />
            ) : (
              <div className="rounded-md w-full aspect-video bg-black/50 flex items-center justify-center text-gray-500 text-sm">
                {step.status === 'in-progress' && <SpinnerIcon className="w-5 h-5" />}
                {step.status === 'failed' && 'Fallito'}
                {step.status === 'pending' && 'In attesa...'}
                {step.status === 'completed' && 'Fatto'}
              </div>
            )}
          </div>
        </div>
      )}

      {step.status !== 'pending' && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2">DIRETTIVA:</h4>
            <pre className="text-xs text-gray-400 bg-black/50 p-3 rounded-md border border-gray-700 whitespace-pre-wrap font-mono">{step.prompt}</pre>
          </div>
      )}
    </div>
  );
};

export default StepCard;
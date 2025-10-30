import React from 'react';

interface ExamplePreviewProps {
  onImageClick: (src: string) => void;
}

const ExamplePreview: React.FC<ExamplePreviewProps> = ({ onImageClick }) => {
  const beforeImageUrl = "https://www.federicopasinetti.it/wp-content/uploads/2025/10/ved-1.jpg";
  const afterImageUrl = "https://www.federicopasinetti.it/wp-content/uploads/2025/10/restored-photo-1.png";

  return (
    <div className="mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-300 text-center">Prima</h3>
          <div 
            className="cursor-pointer rounded-lg overflow-hidden group"
            onClick={() => onImageClick(beforeImageUrl)}
          >
            <img 
              src={beforeImageUrl} 
              alt="Esempio prima del restauro" 
              className="w-full aspect-video object-cover bg-black transition-transform duration-300 group-hover:scale-105" 
            />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-300 text-center">Dopo</h3>
           <div 
            className="cursor-pointer rounded-lg overflow-hidden group"
            onClick={() => onImageClick(afterImageUrl)}
          >
            <img 
              src={afterImageUrl}
              alt="Esempio dopo il restauro" 
              className="w-full aspect-video object-cover bg-black transition-transform duration-300 group-hover:scale-105" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplePreview;

import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imagePreview: string | null;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imagePreview, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageSelect(file);
    }
  }, [onImageSelect, disabled]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openFileDialog = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div
      onClick={openFileDialog}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`relative w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center transition-colors duration-300
        ${disabled ? 'cursor-not-allowed bg-gray-800 border-gray-600' : 'cursor-pointer bg-gray-800/50 border-gray-500 hover:border-blue-400 hover:bg-gray-800'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={disabled}
      />
      {imagePreview ? (
        <img src={imagePreview} alt="Preview" className="object-contain w-full h-full rounded-lg" />
      ) : (
        <div className="text-center text-gray-400">
          <UploadIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Clicca per caricare o trascina e rilascia</p>
          <p className="text-sm">PNG, JPG o WEBP</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
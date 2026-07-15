import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropImage';
import imageCompression from 'browser-image-compression';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedUrl: string, compressedFile: File) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteLocal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      // 1. Crop image
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedFile) throw new Error("Failed to crop image");

      // 2. Compress image to max 70KB, WebP
      const options = {
        maxSizeMB: 0.07, // 70 KB
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      
      const compressedBlob = await imageCompression(croppedFile, options);
      const finalFile = new File([compressedBlob], "profile.webp", { type: "image/webp" });
      const previewUrl = URL.createObjectURL(finalFile);

      onCropComplete(previewUrl, finalFile);
    } catch (error) {
      console.error("Error cropping/compressing image", error);
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteLocal}
          onZoomChange={setZoom}
        />
      </div>
      <div style={{ padding: '20px', backgroundColor: 'white', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <input 
          type="range" 
          value={zoom} 
          min={1} 
          max={3} 
          step={0.1} 
          aria-labelledby="Zoom" 
          onChange={(e) => setZoom(Number(e.target.value))} 
          style={{ width: '50%', marginRight: '20px' }}
        />
        <button 
          onClick={onCancel}
          disabled={isProcessing}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isProcessing}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--navy, #0a192f)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {isProcessing ? 'Processing...' : 'Crop & Save'}
        </button>
      </div>
    </div>
  );
}

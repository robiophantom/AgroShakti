import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageUpload = ({ selectedImage, onImageSelect }) => {
  const [preview, setPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      onImageSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (showCamera) {
      stopCamera();
      setShowCamera(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    setShowCamera(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          onImageSelect(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result);
          };
          reader.readAsDataURL(file);
          stopCamera();
          setShowCamera(false);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {showCamera ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-96 object-cover bg-gray-900 rounded-lg"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={capturePhoto}
              className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
            >
              <Camera size={24} />
            </button>
            <button
              onClick={() => {
                stopCamera();
                setShowCamera(false);
              }}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      ) : preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Selected plant"
            className="w-full h-96 object-contain bg-gray-100 rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onClick={handleClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <ImageIcon size={48} className="text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Click to upload an image
                </p>
                <p className="text-sm text-gray-500">
                  or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG, JPEG up to 5MB
                </p>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <Upload size={20} />
                <span className="font-medium">Browse Files</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={handleCameraClick}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-green-100 rounded-full">
                <Camera size={48} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Take a photo with camera
                </p>
                <p className="text-sm text-gray-500">
                  Use your device camera
                </p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
import React, { useState } from 'react';
import { useLanguage } from '../../Context/Languagecontext';
import { diseaseService } from '../../Services/Disease';
import toast from 'react-hot-toast';
import ImageUpload from './imageupload';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [diseaseInfo, setDiseaseInfo] = useState(null);
  const { currentLanguage } = useLanguage();

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setResult(null);
    setDiseaseInfo(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setDiseaseInfo(null);

    try {
      const response = await diseaseService.detectDisease(selectedImage);
      setResult(response);

      if (response.diseaseDetected && response.diseaseName) {
        const info = await diseaseService.getDiseaseInfo(
          response.diseaseName,
          currentLanguage
        );
        setDiseaseInfo(info);
      }

      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
      console.error('Disease detection error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Plant Disease Detection
        </h2>
        <p className="text-gray-600 mb-6">
          Upload an image of your plant to detect diseases
        </p>

        <ImageUpload
          selectedImage={selectedImage}
          onImageSelect={handleImageSelect}
        />

        <button
          onClick={handleAnalyze}
          disabled={!selectedImage || analyzing}
          className="w-full btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {analyzing ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Analyze Image</span>
          )}
        </button>

        {result && (
          <div className="mt-6 p-4 border rounded-lg">
            <div className={`flex items-start space-x-3 ${
              result.diseaseDetected ? 'text-red-600' : 'text-green-600'
            }`}>
              {result.diseaseDetected ? (
                <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle size={24} className="flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {result.diseaseDetected ? 'Disease Detected' : 'Plant Healthy'}
                </h3>
                {result.diseaseDetected && (
                  <p className="text-gray-700 font-medium mb-2">
                    Disease: {result.diseaseName}
                  </p>
                )}
                {result.confidence && (
                  <p className="text-sm text-gray-600">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {diseaseInfo && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Disease Information
            </h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {diseaseInfo?.response || diseaseInfo?.message || 'No additional information available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetection;
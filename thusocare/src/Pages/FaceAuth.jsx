import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import '../Styling/FaceAuth.css';
import { createClient } from '@supabase/supabase-js';
import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const rekognition = new RekognitionClient({
    region: process.env.REACT_APP_AWS_REGION,
    credentials: {
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    }
});

export const compareFaces = async (sourceImage, targetImage) => {
    try {
        const params = {
            SourceImage: {
                Bytes: sourceImage // base64 decoded image
            },
            TargetImage: {
                Bytes: targetImage // base64 decoded image
            },
            SimilarityThreshold: 90
        };

        const command = new CompareFacesCommand(params);
        const response = await rekognition.send(command);

        if (response.FaceMatches && response.FaceMatches.length > 0) {
            return {
                isMatch: true,
                similarity: response.FaceMatches[0].Similarity
            };
        }

        return { isMatch: false, similarity: 0 };
    } catch (error) {
        console.error('Face comparison error:', error);
        throw error;
    }
};

const FaceAuth = ({ onSuccess, onError }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  const startCapture = () => {
    setIsCapturing(true);
    setError(null);
    console.log('Starting capture...');
  };

  const capture = useCallback(async () => {
    console.log('=== CAPTURE FUNCTION CALLED ===');
    console.log('Webcam ref current:', webcamRef.current);
    console.log('Loading state:', loading);
    
    if (!webcamRef.current) {
      const errorMsg = 'Webcam reference is null';
      console.error(errorMsg);
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Add early return if already loading to prevent double-clicks
    if (loading) {
      console.log('Already loading, ignoring click');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to capture image...');
      
      const imageSrc = webcamRef.current.getScreenshot();
      console.log('getScreenshot result:', imageSrc ? 'Image captured' : 'No image');
      
      if (!imageSrc) {
        throw new Error('Failed to capture image - getScreenshot returned null');
      }
      
      console.log('Image captured successfully, length:', imageSrc.length);
      console.log('Image preview:', imageSrc.substring(0, 50) + '...');

      // Validate base64 format
      if (!imageSrc.startsWith('data:image/')) {
        throw new Error('Invalid image format returned from webcam');
      }

      // Convert base64 image to blob
      const base64Data = imageSrc.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 data');
      }
      
      console.log('Converting to blob...');
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      console.log('Blob created successfully, size:', blob.size, 'bytes');

      // Validate blob
      if (blob.size === 0) {
        throw new Error('Blob size is 0 - image conversion failed');
      }

      // Check Supabase configuration
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing');
      }

      // Upload to Supabase Storage
      const fileName = `face_auth_${Date.now()}.jpg`;
      console.log('Uploading to Supabase bucket "face-auth"...', fileName);
      
      const { data, error: uploadError } = await supabase.storage
        .from('face-auth')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('face-auth')
        .getPublicUrl(fileName);
      
      console.log('Public URL generated:', publicUrl);

      if (onSuccess) {
        onSuccess(publicUrl);
      }
      setIsCapturing(false);
      setError(null);

    } catch (err) {
      console.error('=== CAPTURE ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      const errorMessage = err.message || 'An error occurred during capture';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
      console.log('=== CAPTURE PROCESS COMPLETED ===');
    }
  }, [loading, onSuccess, onError]);

  // Add debugging for environment variables
  React.useEffect(() => {
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('Supabase URL configured:', !!process.env.REACT_APP_SUPABASE_URL);
    console.log('Supabase Key configured:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
    console.log('AWS Region configured:', !!process.env.REACT_APP_AWS_REGION);
    console.log('AWS Access Key configured:', !!process.env.REACT_APP_AWS_ACCESS_KEY_ID);
    console.log('AWS Secret Key configured:', !!process.env.REACT_APP_AWS_SECRET_ACCESS_KEY);
  }, []);

  return (
    <div className="face-auth-container">
      {isCapturing ? (
        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="webcam"
            onUserMedia={() => {
              console.log('Camera access granted');
              console.log('Webcam ref after user media:', webcamRef.current);
            }}
            onUserMediaError={(err) => {
              console.error('Camera access error:', err);
              setError('Camera access denied or unavailable');
            }}
          />
          <div className="webcam-overlay">
            <div className="face-guide"></div>
          </div>
          <button 
            className="capture-btn"
            onClick={(e) => {
              console.log('Button clicked, event:', e);
              capture();
            }}
            disabled={loading}
            style={{ 
              backgroundColor: loading ? '#ccc' : '#007bff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Capture'}
          </button>
          
          {/* Debug info */}
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <p>Webcam ready: {webcamRef.current ? 'Yes' : 'No'}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>
      ) : (
        <button 
          className="start-auth-btn"
          onClick={startCapture}
        >
          Start Face Authentication
        </button>
      )}
      {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default FaceAuth;
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createVideoCall } from '../services/videoCallService';
import { FaVideo } from 'react-icons/fa';

const VideoCallButton = ({ medicId = 1 }) => {
  const { user } = useAuth();
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  const handleVideoCall = async () => {
    if (!user) {
      alert('Please log in to start a video call');
      return;
    }

    setIsCreatingCall(true);
    try {
      const { call } = await createVideoCall(user.id, medicId);
      // Open video call in new window
      window.open(`/video-call/${call.id}`, '_blank');
    } catch (error) {
      console.error('Error creating video call:', error);
      alert('Failed to start video call. Please try again.');
    } finally {
      setIsCreatingCall(false);
    }
  };

  return (
    <button 
      onClick={handleVideoCall}
      disabled={isCreatingCall}
      className="video-call-btn"
    >
      <FaVideo />
      {isCreatingCall ? 'Connecting...' : 'Start Video Call'}
    </button>
  );
};

export default VideoCallButton;
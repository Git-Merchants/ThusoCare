import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../Styling/VideoCall.css';

const VideoCall = () => {
  const { user } = useAuth();
  const { callId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const setupCall = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup WebRTC
        const config = {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        };

        peerConnectionRef.current = new RTCPeerConnection(config);

        // Add tracks
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsWaiting(false);
            setIsConnected(true);
          }
        };

        // For demo purposes, simulate connection after 3 seconds
        setTimeout(() => {
          setIsWaiting(false);
          setIsConnected(true);
        }, 3000);

      } catch (error) {
        console.error('Error setting up call:', error);
        setError('Unable to access camera/microphone');
      }
    };

    setupCall();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [user]);

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    navigate('/Home');
  };

  if (error) {
    return (
      <div className="video-call-container error-state">
        <div className="error-content">
          <h1>Call Error</h1>
          <p>{error}</p>
          <button className="end-call-btn" onClick={() => navigate('/Home')}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="video-call-container waiting-room">
        <div className="waiting-content">
          <h1>Connecting to Healthcare Professional</h1>
          <div className="local-preview">
            <video ref={localVideoRef} autoPlay muted style={{width: '300px', height: '200px', borderRadius: '8px'}} />
            <p>Your camera preview</p>
          </div>
          <div className="waiting-actions">
            <button className="end-call-btn" onClick={handleEndCall}>
              Cancel Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      <div className="call-header">
        <h1>Video Call with Healthcare Professional</h1>
        <p>Room: {callId}</p>
      </div>
      
      <div className="video-grid">
        <div className="video-container local-video">
          <video ref={localVideoRef} autoPlay muted />
          <div className="video-label">You</div>
        </div>
        
        <div className="video-container remote-video">
          <video ref={remoteVideoRef} autoPlay />
          <div className="video-label">Healthcare Professional</div>
        </div>
      </div>
      
      <div className="call-controls">
        <button className="control-btn end-call-btn" onClick={handleEndCall}>
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
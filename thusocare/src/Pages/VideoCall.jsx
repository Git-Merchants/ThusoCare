import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { joinVideoCall, updateCallStatus, endVideoCall } from '../services/videoCallService';
import '../Styling/VideoCall.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const VideoCall = () => {
  const { user } = useAuth();
  const { callId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  
  const [isCaller, setIsCaller] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [waitingTime, setWaitingTime] = useState(0);
  const [callStatus, setCallStatus] = useState('waiting');
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Debug logging
  console.log('VideoCall component rendered');
  console.log('User:', user);
  console.log('Call ID from params:', callId);

  // Helper functions moved inside component to access state
  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('Sending offer:', offer);
      channelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          from: user.id,
        },
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const createAnswer = async () => {
    try {
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('Sending answer:', answer);
      channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          from: user.id,
        },
      });
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  };

  const handleOffer = async (payload) => {
    try {
      if (payload.from !== user.id) {
        console.log('Handling offer from:', payload.from);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await createAnswer();
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (payload) => {
    try {
      if (payload.from !== user.id) {
        console.log('Handling answer from:', payload.from);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (payload) => {
    try {
      if (payload.from !== user.id) {
        console.log('Adding ICE candidate from:', payload.from);
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  // Request notification permissions and set up timer
  useEffect(() => {
    // Request notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Timer for waiting room
    let interval;
    if (isWaiting) {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaiting]);

  useEffect(() => {
    console.log('VideoCall useEffect triggered');
    console.log('User in useEffect:', user);
    console.log('CallId in useEffect:', callId);
    
    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login');
      return;
    }

    const setupCall = async () => {
      try {
        // Join the video call
        const { call, channel } = await joinVideoCall(callId);
        console.log('Call joined:', call);
        channelRef.current = channel;

        // Check if user is the caller
        const isUserCaller = call.caller_id === user.id;
        setIsCaller(isUserCaller);
        console.log('Is caller:', isUserCaller);

        // Initialize WebRTC
        const config = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
        };

        peerConnectionRef.current = new RTCPeerConnection(config);

        // Set up media stream
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true,
          });
          
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // Add tracks to peer connection
          stream.getTracks().forEach((track) => {
            console.log('Adding track:', track.kind);
            peerConnectionRef.current.addTrack(track, stream);
          });
        } catch (mediaError) {
          console.error('Error accessing media devices:', mediaError);
          setError('Unable to access camera/microphone');
          return;
        }

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate');
            channelRef.current.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                candidate: event.candidate,
                from: user.id,
              },
            });
          }
        };

        // Handle remote stream
        peerConnectionRef.current.ontrack = (event) => {
          console.log('Remote stream received');
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsWaiting(false);
            setCallStatus('connected');
          }
        };

        // Handle connection state changes
        peerConnectionRef.current.onconnectionstatechange = () => {
          console.log('Connection state:', peerConnectionRef.current.connectionState);
          if (peerConnectionRef.current.connectionState === 'connected') {
            setIsWaiting(false);
            setCallStatus('connected');
          } else if (peerConnectionRef.current.connectionState === 'failed') {
            setError('Connection failed');
          }
        };

        // Subscribe to channel events
        channel.subscribe(async (status) => {
          console.log('Channel subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Channel subscribed successfully');
            
            // Announce that user has joined
            channel.send({
              type: 'broadcast',
              event: 'user-joined',
              payload: {
                from: user.id,
                timestamp: Date.now()
              },
            });
          }
        });

        // Handle channel messages
        channel
          .on('broadcast', { event: 'offer' }, ({ payload }) => {
            console.log('Offer received from:', payload.from);
            handleOffer(payload);
          })
          .on('broadcast', { event: 'answer' }, ({ payload }) => {
            console.log('Answer received from:', payload.from);
            handleAnswer(payload);
          })
          .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
            console.log('ICE candidate received from:', payload.from);
            handleIceCandidate(payload);
          })
          .on('broadcast', { event: 'user-joined' }, ({ payload }) => {
            console.log('User joined:', payload);
            if (payload.from !== user.id) {
              // Someone else joined, initiate connection
              if (isUserCaller) {
                console.log('Caller creating offer for new user');
                setTimeout(() => createOffer(), 1000); // Small delay to ensure both sides are ready
              }
              
              // Show notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Healthcare Professional Joined', {
                  body: 'Your video call is now connected.',
                  icon: '/favicon.ico'
                });
              }
            }
          })
          .on('broadcast', { event: 'user-left' }, ({ payload }) => {
            console.log('User left:', payload);
            if (payload.from !== user.id) {
              setCallStatus('disconnected');
            }
          });

        // Set up a timeout for waiting (5 minutes)
        const waitingTimeout = setTimeout(() => {
          if (isWaiting) {
            console.log('Waiting timeout reached');
            setError('Timeout: No one joined the call');
          }
        }, 300000);

        // Cleanup timeout when call connects
        if (!isWaiting) {
          clearTimeout(waitingTimeout);
        }

      } catch (error) {
        console.error('Error setting up call:', error);
        setError('Failed to setup call: ' + error.message);
      }
    };

    setupCall();

    // Cleanup function
    return () => {
      console.log('Cleaning up video call');
      
      // Close media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Unsubscribe from channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [callId, user, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      // Send user left event
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'user-left',
          payload: {
            from: user.id,
            timestamp: Date.now()
          },
        });
      }

      // Update call status in database
      await endVideoCall(callId);
      
      // Close media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close WebRTC connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Unsubscribe and remove channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      }
      
      // Navigate back to home
      navigate('/Home');
    } catch (error) {
      console.error('Error ending call:', error);
      navigate('/Home');
    }
  };

  // Error state
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

  // Waiting Room UI
  if (isWaiting) {
    return (
      <div className="video-call-container waiting-room">
        <div className="waiting-content">
          <div className="waiting-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          
          <h1>Waiting for Healthcare Professional</h1>
          <p className="waiting-time">Time waiting: {formatTime(waitingTime)}</p>
          
          <div className="waiting-status">
            <div className="status-indicator">
              <div className="pulse-dot"></div>
              <span>Connecting to professional...</span>
            </div>
          </div>

          <div className="waiting-info">
            <p>Please wait while we connect you to a healthcare professional.</p>
            <p>Your call will begin shortly.</p>
          </div>

          <div className="local-preview">
            <video ref={localVideoRef} autoPlay muted style={{width: '200px', height: '150px', borderRadius: '8px'}} />
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

  // Main Video Call UI
  return (
    <div className="video-call-container">
      <div className="call-header">
        <h1>Video Call</h1>
        <p>Call ID: {callId}</p>
        <p>Status: {callStatus}</p>
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
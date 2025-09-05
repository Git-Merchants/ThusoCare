import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Styling/VideoCall.css';
import { supabase } from '../supabase/supabaseConfig';

const VideoCallSimple = () => {
  const { callId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [error, setError] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const setupCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (!mounted) return;
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const config = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
        };

        peerConnectionRef.current = new RTCPeerConnection(config);
        const pc = peerConnectionRef.current;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsWaiting(false);
            setIsConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            sendMessage({
              type: 'ice-candidate',
              candidate: event.candidate
            });
          }
        };

        setupSignaling();

      } catch (error) {
        console.error('Error setting up call:', error);
        setError('Unable to access camera/microphone');
      }
    };

    const setupSignaling = () => {
      channelRef.current = supabase
        .channel(`call-${callId}`)
        .on('broadcast', { event: 'webrtc' }, ({ payload }) => {
          handleMessage(payload);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Determine who initiates based on a simple rule
            const shouldInitiate = Math.random() > 0.5;
            setIsInitiator(shouldInitiate);
            
            if (shouldInitiate) {
              setTimeout(createOffer, 2000);
            }
          }
        });
    };

    const sendMessage = (message) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc',
          payload: message
        });
      }
    };

    const handleMessage = async (message) => {
      const pc = peerConnectionRef.current;
      if (!pc || !mounted) return;

      try {
        switch (message.type) {
          case 'offer':
            await pc.setRemoteDescription(message.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendMessage({ type: 'answer', answer });
            break;
            
          case 'answer':
            await pc.setRemoteDescription(message.answer);
            break;
            
          case 'ice-candidate':
            if (pc.remoteDescription) {
              await pc.addIceCandidate(message.candidate);
            }
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    const createOffer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc || !mounted) return;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendMessage({ type: 'offer', offer });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    setupCall();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [callId]);

  const handleEndCall = async () => {
    try {
      await supabase
        .from('video_calls')
        .update({ call_status: 'ended' })
        .eq('room_id', callId);
    } catch (error) {
      console.error('Error updating call status:', error);
    }
    
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
          <h1>Connecting to Call</h1>
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
        <h1>Video Call</h1>
        <p>Room: {callId}</p>
      </div>
      
      <div className="video-grid">
        <div className="video-container local-video">
          <video ref={localVideoRef} autoPlay muted />
          <div className="video-label">You</div>
        </div>
        
        <div className="video-container remote-video">
          <video ref={remoteVideoRef} autoPlay />
          <div className="video-label">{isConnected ? 'Connected' : 'Waiting...'}</div>
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

export default VideoCallSimple;
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Styling/VideoCall.css';
import { supabase } from '../supabase/supabaseConfig';

const VideoCall = () => {
  const { callId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  const userIdRef = useRef(Math.random().toString(36).substr(2, 9));
  
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [error, setError] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);
  
  const navigate = useNavigate();
  const isDoctor = localStorage.getItem('loggedInDoctor');

  useEffect(() => {
    const setupCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
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

        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsWaiting(false);
            setIsConnected(true);
          }
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({
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
        .channel(`room-${callId}`)
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          if (payload.userId !== userIdRef.current) {
            handleSignal(payload);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setTimeout(() => {
              sendSignal({ type: 'user-joined', userId: userIdRef.current });
            }, 1000);
          }
        });
    };

    const sendSignal = (data) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { ...data, userId: userIdRef.current }
        });
      }
    };

    const handleSignal = async (signal) => {
      try {
        const pc = peerConnectionRef.current;
        switch (signal.type) {
          case 'user-joined':
            setRemoteUserId(signal.userId);
            if (userIdRef.current < signal.userId && pc.signalingState === 'stable') {
              createOffer();
            }
            break;
          case 'offer':
            await handleOffer(signal.offer);
            break;
          case 'answer':
            await handleAnswer(signal.answer);
            break;
          case 'ice-candidate':
            await handleIceCandidate(signal.candidate);
            break;
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    };

    const createOffer = async () => {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        sendSignal({ type: 'offer', offer });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    const handleOffer = async (offer) => {
      try {
        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'answer', answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async (answer) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };

    const handleIceCandidate = async (candidate) => {
      try {
        await peerConnectionRef.current.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
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
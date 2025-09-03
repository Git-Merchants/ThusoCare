import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const createVideoCall = async (userId, medicId = 1) => {
  try {
    console.log('Creating video call for user:', userId, 'and medicId:', medicId);
    
    // Fetch the medic's user_id from the medics table
    const { data: medic, error: medicError } = await supabase
      .from('medics')
      .select('user_id')
      .eq('id', medicId)
      .single();

    if (medicError) {
      console.error('Error fetching medic:', medicError);
      throw medicError;
    }

    if (!medic || !medic.user_id) {
      throw new Error('Medic not found or no associated user_id');
    }

    const receiverId = medic.user_id;
    console.log('Resolved receiverId (medic user_id):', receiverId);
    
    // Generate a unique room ID
    const roomId = crypto.randomUUID();
    
    const { data: call, error } = await supabase
      .from('video_calls')
      .insert([
        {
          caller_id: userId,
          receiver_id: receiverId,
          room_id: roomId,
          call_status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Call created:', call);

    // Create channel with the call ID, not room ID for consistency
    const channel = supabase.channel(`video-call:${call.id}`, {
      config: {
        broadcast: { 
          ack: true,
          self: false // Don't receive your own messages
        }
      }
    });

    return { call, channel };
  } catch (error) {
    console.error('Error creating video call:', error);
    throw error;
  }
};

export const joinVideoCall = async (callId) => {
  try {
    console.log('Joining video call:', callId);
    
    // Validate callId
    if (!callId) {
      throw new Error('Call ID is required');
    }
    
    // Fetch the call details
    const { data: call, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (error) {
      console.error('Error fetching call:', error);
      throw error;
    }

    if (!call) {
      throw new Error('Call not found');
    }

    console.log('Call found:', call);

    // Check if call is still valid (not ended)
    if (call.call_status === 'ended') {
      throw new Error('This call has already ended');
    }

    // Update call status to 'active' when someone joins (if not already active)
    if (call.call_status === 'pending') {
      const { error: updateError } = await supabase
        .from('video_calls')
        .update({ 
          call_status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', callId);

      if (updateError) {
        console.error('Error updating call status:', updateError);
        // Don't throw here as the call can still proceed
      }
    }

    // Create channel using call ID for consistency
    const channel = supabase.channel(`video-call:${call.id}`, {
      config: {
        broadcast: { 
          ack: true,
          self: false // Don't receive your own messages
        },
        presence: {
          key: 'user-presence'
        }
      }
    });

    return { call, channel };
  } catch (error) {
    console.error('Error joining video call:', error);
    throw error;
  }
};

export const updateCallStatus = async (callId, status) => {
  try {
    if (!callId || !status) {
      throw new Error('Call ID and status are required');
    }

    const updateData = { 
      call_status: status,
      updated_at: new Date().toISOString()
    };

    // Add timestamp for specific statuses
    if (status === 'active') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'ended') {
      updateData.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('video_calls')
      .update(updateData)
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      console.error('Error updating call status:', error);
      throw error;
    }

    console.log('Call status updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
};

export const endVideoCall = async (callId) => {
  try {
    if (!callId) {
      throw new Error('Call ID is required');
    }

    const { data, error } = await supabase
      .from('video_calls')
      .update({
        call_status: 'ended',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      console.error('Error ending call:', error);
      throw error;
    }

    console.log('Call ended successfully:', data);
    return data;
  } catch (error) {
    console.error('Error ending video call:', error);
    throw error;
  }
};

// Helper function to get call details
export const getVideoCallDetails = async (callId) => {
  try {
    const { data: call, error } = await supabase
      .from('video_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (error) {
      console.error('Error fetching call details:', error);
      throw error;
    }

    return call;
  } catch (error) {
    console.error('Error getting video call details:', error);
    throw error;
  }
};

// Helper function to check if user has permission to join call
export const canUserJoinCall = async (callId, userId) => {
  try {
    const call = await getVideoCallDetails(callId);
    
    // Check if user is either caller or receiver (medic)
    const canJoin = call.caller_id === userId || call.receiver_id === userId;
    
    return {
      canJoin,
      reason: canJoin ? null : 'You are not authorized to join this call'
    };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return {
      canJoin: false,
      reason: 'Error checking permissions'
    };
  }
};
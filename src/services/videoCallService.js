const supabase = window.supabaseClient;

// Create video call request in database
export const createVideoCall = async (userId) => {
  const roomId = crypto.randomUUID();
  
  try {
    const { data, error } = await supabase
      .from('video_calls')
      .insert({
        room_id: roomId,
        user_id: userId,
        call_status: 'pending'
      })
      .select();
    
    if (error) throw error;
    
    return { roomId, callId: data[0].id };
  } catch (error) {
    console.error('Error creating video call:', error);
    throw error;
  }
};

// Simple video call - just generate a room ID and navigate (fallback)
export const createSimpleVideoCall = () => {
  const roomId = crypto.randomUUID();
  return { roomId };
};
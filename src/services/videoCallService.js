import { supabase } from '../supabase/supabaseConfig';

// Create video call request in database
export const createVideoCall = async (userId) => {
  const roomId = crypto.randomUUID();
  
  try {
    // If no userId provided, try to get from localStorage or auth
    let actualUserId = userId;
    if (!actualUserId) {
      // Try different localStorage keys
      const loggedInUser = localStorage.getItem('loggedInUser') || localStorage.getItem('currentUser');
      if (loggedInUser) {
        const userData = JSON.parse(loggedInUser);
        actualUserId = userData.user_id || userData.id;
      }
      
      // If still no userId, try to get from database using email
      if (!actualUserId && loggedInUser) {
        const userData = JSON.parse(loggedInUser);
        if (userData.email) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', userData.email)
            .single();
          
          if (userRecord) {
            actualUserId = userRecord.user_id;
          }
        }
      }
    }
    
    console.log('Available localStorage keys:', Object.keys(localStorage));
    console.log('Attempting to use userId:', actualUserId);
    
    // Allow anonymous calls - caller_id can be null
    console.log('Creating video call for user:', actualUserId || 'anonymous');
    
    const { data, error } = await supabase
      .from('video_calls')
      .insert({
        room_id: roomId,
        caller_id: actualUserId || null,
        call_status: 'pending'
      })
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      if (error.code === '23503') {
        throw new Error('Invalid user ID. User not found in database.');
      }
      if (error.code === '42501' || error.message.includes('permission')) {
        throw new Error('Permission denied. Please check database policies.');
      }
      throw error;
    }
    
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
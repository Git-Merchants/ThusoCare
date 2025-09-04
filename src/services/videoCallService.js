// Simple video call - just generate a room ID and navigate
export const createVideoCall = () => {
  const roomId = crypto.randomUUID();
  return { roomId };
};
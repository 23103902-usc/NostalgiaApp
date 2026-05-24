const CLOUD_NAME = 'dii9rvq50';
const UPLOAD_PRESET = 'nostalgia-app';

export const uploadMedia = async (fileUri, type = 'image') => {
  const formData = new FormData();
  const isVideo = type === 'video';
  
  formData.append('file', {
    uri: fileUri,
    type: isVideo ? 'video/mp4' : 'image/jpeg',
    name: isVideo ? 'upload.mp4' : 'upload.jpg',
  });

  formData.append('upload_preset', UPLOAD_PRESET);
  
  const uploadEndpoint = isVideo ? 'video' : 'image';

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${uploadEndpoint}/upload`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  if (!data.secure_url) {
    throw new Error('Upload failed');
  }

  return {
    full: data.secure_url,
    thumb: data.secure_url,
    publicId: data.public_id,
  };
};
const CLOUD_NAME = 'dii9rvq50';
const UPLOAD_PRESET = 'nostalgia-app';

export const uploadMedia = async (fileUri, type = 'image') => {
  const formData = new FormData();

  formData.append('file', {
    uri: fileUri,
    type: type === 'video' ? 'video/mp4' : 'image/jpeg',
    name: 'upload.jpg',
  });

  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();

  console.log('CLOUDINARY RESPONSE:', data);

  if (data.error) {
    throw new Error(data.error.message);
  }

  if (!data.secure_url) {
    throw new Error('Cloudinary upload failed');
  }

  return data.secure_url;
};
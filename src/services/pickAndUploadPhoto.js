import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { uploadMedia } from './cloudinary';

export const pickAndUploadPhoto = async (year, album) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Media library permission is required');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  let uri = asset.uri;
  const type = asset.type;
  
  // CONVERT HEIC TO JPEG FOR IMAGES
  if (type === 'image') {
    const fileExtension = uri.split('.').pop()?.toLowerCase();
    if (fileExtension === 'heic' || fileExtension === 'heif') {
      console.log('Converting HEIC to JPEG...');
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1920 } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        uri = manipulated.uri;
        console.log('HEIC converted successfully');
      } catch (e) {
        console.log('HEIC conversion failed:', e);
      }
    }
  }
  
  // Upload to Cloudinary
  const uploadResult = await uploadMedia(uri, type);
  
  let thumbUrl = uploadResult.full;
  
  // GENERATE VIDEO THUMBNAIL
  if (type === 'video') {
    try {
      const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
      const thumbUpload = await uploadMedia(thumbnail.uri, 'image');
      thumbUrl = thumbUpload.full;
      console.log('Video thumbnail generated');
    } catch (error) {
      console.log('Video thumbnail error:', error);
    }
  }

  return {
    full: uploadResult.full,
    thumb: thumbUrl,
    year: year,
    album: album,
    mediaType: type,
  };
};
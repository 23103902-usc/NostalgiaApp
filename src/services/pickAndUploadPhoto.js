import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { uploadMedia } from './cloudinary';
import { addPhotoToPlace } from './places';

export const pickAndUploadPhoto = async (placeId) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (result.canceled) return;

  let uri = result.assets[0].uri;

  // convert HEIC → JPG (important for iPhone)
  const converted = await ImageManipulator.manipulateAsync(
    uri,
    [],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  uri = converted.uri;

  // safety check
  const check = await fetch(uri);
  if (!check.ok) {
    throw new Error('File not accessible after conversion');
  }

  // upload to Cloudinary
  const url = await uploadMedia(uri, 'image');

  // save to Firestore
  await addPhotoToPlace(placeId, url);

  return url;
};
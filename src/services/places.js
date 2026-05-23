import { auth, db } from '../config/firebase';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';

const getPlacesCollection = () => {

  const uid = auth.currentUser?.uid;

  return collection(
    db,
    'users',
    uid,
    'places'
  );
};

// ADD PLACE
export const addPlace = async (
  latitude,
  longitude
) => {

  await addDoc(getPlacesCollection(), {
    latitude,
    longitude,
    title: 'New Place',
    photos: [],
  });

};

// GET PLACES
export const getPlaces = async () => {

  const snap = await getDocs(
    getPlacesCollection()
  );

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

};

// DELETE PLACE
export const deletePlace = async (id) => {

  const uid = auth.currentUser.uid;

  await deleteDoc(
    doc(
      db,
      'users',
      uid,
      'places',
      id
    )
  );

};

// RENAME PLACE
export const renamePlace = async (
  id,
  newTitle
) => {

  const uid = auth.currentUser.uid;

  await updateDoc(
    doc(
      db,
      'users',
      uid,
      'places',
      id
    ),
    {
      title: newTitle,
    }
  );

};

// ADD PHOTO
export const addPhotoToPlace = async (
  placeId,
  photoUrl
) => {

  const uid = auth.currentUser.uid;

  await updateDoc(
    doc(
      db,
      'users',
      uid,
      'places',
      placeId
    ),
    {
      photos: arrayUnion({
        url: photoUrl,
        createdAt: new Date().toISOString(),
      }),
    }
  );

};
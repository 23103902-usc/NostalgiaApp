import { db } from '../config/firebase';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';

const PLACES = 'places';

export const addPlace = async (latitude, longitude) => {
  await addDoc(collection(db, PLACES), {
    latitude,
    longitude,
    title: 'New Place',
    photos: [],
  });
};

export const getPlaces = async () => {
  const snap = await getDocs(collection(db, PLACES));

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const deletePlace = async (id) => {
  await deleteDoc(doc(db, PLACES, id));
};

export const renamePlace = async (id, newTitle) => {
  await updateDoc(doc(db, PLACES, id), {
    title: newTitle,
  });
};

export const addPhotoToPlace = async (placeId, photoUrl) => {
  await updateDoc(doc(db, PLACES, placeId), {
    photos: arrayUnion({
      url: photoUrl,
      createdAt: new Date(),
    }),
  });
};
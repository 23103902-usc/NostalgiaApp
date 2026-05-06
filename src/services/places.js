import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const PLACES = 'places';

// ➕ ADD MARKER
export const addPlace = async (latitude, longitude) => {
  await addDoc(collection(db, PLACES), {
    latitude,
    longitude,
    title: 'New Place',
    photos: [],
  });
};

// 📥 GET MARKERS
export const getPlaces = async () => {
  const snap = await getDocs(collection(db, PLACES));

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
};

// 🗑 DELETE MARKER
export const deletePlace = async (id) => {
  await deleteDoc(doc(db, PLACES, id));
};

// ✏️ RENAME MARKER
export const renamePlace = async (id, newTitle) => {
  await updateDoc(doc(db, PLACES, id), {
    title: newTitle,
  });
};
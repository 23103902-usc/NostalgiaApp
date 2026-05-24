import { auth, db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

// Get current user's places reference
const getRef = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  return collection(db, 'users', user.uid, 'places');
};

// CREATE PLACE (only you see it initially)
export const addPlace = async (lat, lng, year) => {
  await addDoc(getRef(), {
    latitude: lat,
    longitude: lng,
    title: 'New Place',
    photos: [],
    year: year,
    sharedWith: [], // friends added here will see it
  });
};

// GET MY PLACES (only your own)
export const getMyPlaces = async () => {
  const snap = await getDocs(getRef());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// GET PLACES SHARED WITH ME (friends' markers)
export const getSharedPlaces = async () => {
  const currentUser = auth.currentUser;
  const currentUserId = currentUser.uid;
  
  const usersSnapshot = await getDocs(collection(db, 'users'));
  let sharedPlaces = [];
  
  for (const userDoc of usersSnapshot.docs) {
    const placesSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'places'));
    
    placesSnapshot.forEach(placeDoc => {
      const place = placeDoc.data();
      if (place.sharedWith?.some(share => share.userId === currentUserId)) {
        sharedPlaces.push({
          id: placeDoc.id,
          ...place,
          ownerId: userDoc.id,
        });
      }
    });
  }
  return sharedPlaces;
};

// GET ALL PLACES (yours + shared with you)
export const getAllPlaces = async () => {
  const [myPlaces, sharedPlaces] = await Promise.all([
    getMyPlaces(),
    getSharedPlaces(),
  ]);
  return [...myPlaces, ...sharedPlaces];
};

// ADD FRIEND TO MARKER (they can now see and add photos)
export const addFriendToMarker = async (placeId, friendId, friendEmail, friendName) => {
  const user = auth.currentUser;
  const placeRef = doc(db, 'users', user.uid, 'places', placeId);
  await updateDoc(placeRef, {
    sharedWith: arrayUnion({
      userId: friendId,
      email: friendEmail,
      name: friendName,
      addedAt: new Date().toISOString(),
    }),
  });
};

// RENAME PLACE
export const renamePlace = async (id, title) => {
  const user = auth.currentUser;
  await updateDoc(doc(db, 'users', user.uid, 'places', id), { title });
};

// DELETE ENTIRE PLACE (only you can delete your own)
export const deletePlace = async (id) => {
  const user = auth.currentUser;
  await deleteDoc(doc(db, 'users', user.uid, 'places', id));
};

// ADD PHOTO/VIDEO (tracks who uploaded)
export const addPhotoToPlace = async (id, photo) => {
  const user = auth.currentUser;
  await updateDoc(doc(db, 'users', user.uid, 'places', id), {
    photos: arrayUnion({
      full: photo.full,
      thumb: photo.thumb,
      createdAt: new Date().toISOString(),
      year: photo.year,
      album: photo.album,
      mediaType: photo.mediaType,
      uploadedBy: user.uid,
      uploadedByEmail: user.email,
      uploadedByName: user.email?.split('@')[0],
    }),
  });
};

// DELETE PHOTO/VIDEO (only if you uploaded it)
export const deletePhotoFromPlace = async (placeId, photoToDelete) => {
  const user = auth.currentUser;
  const placeRef = doc(db, 'users', user.uid, 'places', placeId);
  const placeDoc = await getDoc(placeRef);
  
  if (placeDoc.exists()) {
    const currentPhotos = placeDoc.data().photos || [];
    const updatedPhotos = currentPhotos.filter(photo => 
      !(photo.full === photoToDelete.full && 
        photo.uploadedBy === user.uid)
    );
    await updateDoc(placeRef, { photos: updatedPhotos });
  }
};
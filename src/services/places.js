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
  const user = auth.currentUser;
  await addDoc(getRef(), {
    latitude: lat,
    longitude: lng,
    title: 'New Place',
    photos: [],
    year: year,
    sharedWith: [],
    createdAt: new Date().toISOString(),
    ownerId: user.uid,
  });
  console.log('✅ Marker created');
};

// GET MY PLACES (only your own)
export const getMyPlaces = async () => {
  const user = auth.currentUser;
  const snap = await getDocs(getRef());
  return snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data(), 
    ownerId: user.uid 
  }));
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
          isShared: true,
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
  console.log('📊 My places:', myPlaces.length, 'Shared:', sharedPlaces.length);
  return [...myPlaces, ...sharedPlaces];
};

// ADD FRIEND TO MARKER
export const addFriendToMarker = async (placeId, friendId, friendEmail, friendName) => {
  const user = auth.currentUser;
  const placeRef = doc(db, 'users', user.uid, 'places', placeId);
  
  // Make sure all values are defined
  const friendData = {
    userId: friendId,
    email: friendEmail || '',
    name: friendName || friendEmail?.split('@')[0] || 'Friend',
    addedAt: new Date().toISOString(),
  };
  
  console.log('Adding friend data:', friendData);
  
  await updateDoc(placeRef, {
    sharedWith: arrayUnion(friendData)
  });
  console.log('✅ Friend added to marker:', friendName);
};

// RENAME PLACE (only owner)
export const renamePlace = async (id, title) => {
  const user = auth.currentUser;
  await updateDoc(doc(db, 'users', user.uid, 'places', id), { title });
  console.log('✅ Marker renamed');
};

// DELETE ENTIRE PLACE (only owner)
export const deletePlace = async (id) => {
  const user = auth.currentUser;
  await deleteDoc(doc(db, 'users', user.uid, 'places', id));
  console.log('✅ Marker deleted');
};

// ADD PHOTO/VIDEO (tracks who uploaded)
export const addPhotoToPlace = async (ownerId, placeId, photo) => {
  const user = auth.currentUser;
  const placeRef = doc(db, 'users', ownerId, 'places', placeId);
  await updateDoc(placeRef, {
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
  console.log('✅ Photo/Video added by:', user.email);
};

// DELETE PHOTO/VIDEO (only if you uploaded it)
export const deletePhotoFromPlace = async (ownerId, placeId, photoToDelete) => {
  const currentUser = auth.currentUser;
  
  if (photoToDelete.uploadedBy !== currentUser.uid) {
    throw new Error('You can only delete your own photos/videos');
  }
  
  const placeRef = doc(db, 'users', ownerId, 'places', placeId);
  const placeDoc = await getDoc(placeRef);
  
  if (placeDoc.exists()) {
    const currentPhotos = placeDoc.data().photos || [];
    const updatedPhotos = currentPhotos.filter(photo => 
      !(photo.full === photoToDelete.full && 
        photo.createdAt === photoToDelete.createdAt)
    );
    await updateDoc(placeRef, { photos: updatedPhotos });
    console.log('✅ Photo/Video deleted by:', currentUser.email);
    return true;
  }
  throw new Error('Place not found');
};
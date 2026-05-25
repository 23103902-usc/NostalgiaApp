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
    ownerName: user.email?.split('@')[0] || 'User',
    ownerEmail: user.email,
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
    ownerId: user.uid,
    ownerName: user.email?.split('@')[0] || 'User',
    ownerEmail: user.email,
  }));
};

// GET PLACES SHARED WITH ME (friends' markers)
export const getSharedPlaces = async () => {
  const currentUser = auth.currentUser;
  const currentUserId = currentUser.uid;
  
  const usersSnapshot = await getDocs(collection(db, 'users'));
  let sharedPlaces = [];
  
  for (const userDoc of usersSnapshot.docs) {
    const ownerProfile = await getDoc(doc(db, 'profiles', userDoc.id));
    const ownerName = ownerProfile.exists() 
      ? (ownerProfile.data().displayName || ownerProfile.data().email?.split('@')[0] || 'User')
      : userDoc.id.substring(0, 8);
    
    const placesSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'places'));
    
    placesSnapshot.forEach(placeDoc => {
      const place = placeDoc.data();
      if (place.sharedWith?.some(share => share.userId === currentUserId)) {
        sharedPlaces.push({
          id: placeDoc.id,
          ...place,
          ownerId: userDoc.id,
          ownerName: place.ownerName || ownerName,
          ownerEmail: place.ownerEmail,
          isShared: true,
        });
      }
    });
  }
  console.log('📊 Shared places found:', sharedPlaces.length);
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

// ADD FRIEND TO MARKER - Anyone with access can add friends
export const addFriendToMarker = async (placeId, friendId, friendEmail, friendName) => {
  const user = auth.currentUser;
  const placeRef = doc(db, 'users', user.uid, 'places', placeId);
  
  const friendData = {
    userId: friendId,
    email: friendEmail || '',
    name: friendName || friendEmail?.split('@')[0] || 'Friend',
    addedAt: new Date().toISOString(),
    addedBy: user.uid,
    addedByEmail: user.email,
  };
  
  console.log('Adding friend to marker:', friendData);
  
  await updateDoc(placeRef, {
    sharedWith: arrayUnion(friendData)
  });
  console.log('✅ Friend added to marker by:', user.email);
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
  console.log('✅ Marker deleted by owner:', user.email);
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
      uploadedByName: user.email?.split('@')[0] || 'User',
    }),
  });
  console.log('✅ Photo/Video added by:', user.email);
};

// DELETE PHOTO/VIDEO - Owner can delete any, others only their own
export const deletePhotoFromPlace = async (ownerId, placeId, photoToDelete) => {
  const currentUser = auth.currentUser;
  const isOwner = ownerId === currentUser.uid;
  
  // Owner can delete ANY photo in their marker
  // Others can only delete their own photos
  if (!isOwner && photoToDelete.uploadedBy !== currentUser.uid) {
    throw new Error('Only the marker owner or the person who uploaded this can delete it.');
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
    console.log('✅ Photo/Video deleted by:', currentUser.email, 'IsOwner:', isOwner);
    return true;
  }
  throw new Error('Place not found');
};
import { auth, db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

// CREATE USER PROFILE (call on login/register)
export const createUserProfile = async (user) => {
  const userRef = doc(db, 'profiles', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      friends: [],
      friendRequests: [],
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Profile created for:', user.email);
  }
};

// SEND FRIEND REQUEST
export const sendFriendRequest = async (toEmail) => {
  const currentUser = auth.currentUser;
  
  // Find user by email
  const profilesRef = collection(db, 'profiles');
  const q = query(profilesRef, where('email', '==', toEmail));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('User not found');
  }
  
  const toUser = querySnapshot.docs[0];
  const toUserId = toUser.id;
  
  // Check if already friends
  const currentUserProfile = await getDoc(doc(db, 'profiles', currentUser.uid));
  const currentFriends = currentUserProfile.data()?.friends || [];
  
  if (currentFriends.includes(toUserId)) {
    throw new Error('Already friends');
  }
  
  // Check if request already exists
  const existingQuery = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', currentUser.uid),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending')
  );
  const existing = await getDocs(existingQuery);
  
  if (!existing.empty) {
    throw new Error('Friend request already sent');
  }
  
  // Send request
  await addDoc(collection(db, 'friendRequests'), {
    fromUserId: currentUser.uid,
    toUserId: toUserId,
    fromUserEmail: currentUser.email,
    fromUserName: currentUserProfile.data()?.displayName || currentUser.email,
    toUserEmail: toEmail,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  
  console.log('✅ Friend request sent to:', toEmail);
};

// ACCEPT FRIEND REQUEST
export const acceptFriendRequest = async (requestId, fromUserId) => {
  const currentUserId = auth.currentUser.uid;
  
  // Update request status
  await updateDoc(doc(db, 'friendRequests', requestId), {
    status: 'accepted',
  });
  
  // Add to current user's friends
  await updateDoc(doc(db, 'profiles', currentUserId), {
    friends: arrayUnion(fromUserId)
  });
  
  // Add to sender's friends (CRITICAL - both ways)
  await updateDoc(doc(db, 'profiles', fromUserId), {
    friends: arrayUnion(currentUserId)
  });
  
  console.log('✅ Friend request accepted. Both users now friends.');
};

// DECLINE FRIEND REQUEST
export const declineFriendRequest = async (requestId) => {
  await updateDoc(doc(db, 'friendRequests', requestId), {
    status: 'declined',
  });
  console.log('✅ Friend request declined');
};

// GET PENDING FRIEND REQUESTS (incoming)
export const getPendingRequests = async () => {
  const currentUserId = auth.currentUser.uid;
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', currentUserId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// GET SENT REQUESTS (outgoing)
export const getSentRequests = async () => {
  const currentUserId = auth.currentUser.uid;
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', currentUserId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// GET ALL FRIENDS
export const getFriends = async () => {
  const currentUserId = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, 'profiles', currentUserId));
  const friendIds = userDoc.data()?.friends || [];
  
  const friends = [];
  for (const friendId of friendIds) {
    const friendDoc = await getDoc(doc(db, 'profiles', friendId));
    if (friendDoc.exists()) {
      friends.push({ id: friendId, ...friendDoc.data() });
    }
  }
  console.log('📋 Friends list loaded:', friends.length);
  return friends;
};

// REMOVE FRIEND
export const removeFriend = async (friendId) => {
  const currentUserId = auth.currentUser.uid;
  
  await updateDoc(doc(db, 'profiles', currentUserId), {
    friends: arrayRemove(friendId)
  });
  
  await updateDoc(doc(db, 'profiles', friendId), {
    friends: arrayRemove(currentUserId)
  });
  
  console.log('✅ Friend removed');
};
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Video, ResizeMode } from 'expo-av';
import { auth } from '../src/config/firebase';

import {
  getAllPlaces,
  addPlace,
  deletePlace,
  renamePlace,
  addPhotoToPlace,
  deletePhotoFromPlace,
  addFriendToMarker,
} from '../src/services/places';

import { pickAndUploadPhoto } from '../src/services/pickAndUploadPhoto';
import { getFriends } from '../src/services/friends';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const PlaceMarker = React.memo(({ place, onPress, selectedId }) => {
  const isSelected = selectedId === place.id;
  const [loaded, setLoaded] = useState(false);

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={() => onPress(place)}
      tracksViewChanges={!loaded}
    >
      <View style={styles.markerContainer} pointerEvents="none">
        {!!(place.photos?.[0]?.thumb || place.photos?.[0]?.url) && (
          <View style={styles.thumbWrapper}>
            <Image
              source={{ uri: place.photos[0].thumb || place.photos[0].url }}
              style={styles.thumb}
              onLoadEnd={() => setLoaded(true)}
            />
          </View>
        )}
        <View style={[styles.pin, isSelected && styles.pinActive]} />
      </View>
    </Marker>
  );
});

export default function MapScreen() {
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [friendsList, setFriendsList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [minYear] = useState(2000);
  const [maxYear] = useState(new Date().getFullYear());

  const loadPlaces = async () => {
    try {
      const allPlaces = await getAllPlaces();
      setPlaces(allPlaces);
    } catch (error) {
      console.error('Load places error:', error);
    }
  };

  const loadFriendsList = async () => {
    try {
      const friends = await getFriends();
      setFriendsList(friends);
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    if (!viewerVisible) {
      setViewerIndex(0);
    }
  }, [viewerVisible]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const openSheet = async (place) => {
    setSelectedPlace(place);
    setEditTitleValue(place.title || '');
    await loadFriendsList();
    mapRef.current?.animateToRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 300);
  };

  const closeSheet = () => {
    setSelectedPlace(null);
    setIsEditingTitle(false);
  };

  const handleAddMarker = async () => {
    try {
      const camera = await mapRef.current.getCamera();
      await addPlace(camera.center.latitude, camera.center.longitude, selectedYear);
      await loadPlaces();
    } catch (error) {
      Alert.alert('Error', 'Failed to add marker');
    }
  };

  const handleAddPhoto = async () => {
    if (!selectedPlace) return;
    try {
      const photo = await pickAndUploadPhoto(selectedYear, 'map');
      if (!photo) return;
      await addPhotoToPlace(selectedPlace.ownerId, selectedPlace.id, photo);
      await loadPlaces();
      Alert.alert('Success', 'Photo/Video added!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add photo');
    }
  };

  const handleRenamePlace = async () => {
    if (!selectedPlace || !editTitleValue || editTitleValue === selectedPlace.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await renamePlace(selectedPlace.id, editTitleValue);
      setSelectedPlace({ ...selectedPlace, title: editTitleValue });
      await loadPlaces();
      setIsEditingTitle(false);
      Alert.alert('Success', 'Title updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to rename');
    }
  };

  const handleDeleteMarker = async () => {
    if (!isOwner) {
      Alert.alert('Cannot Delete', 'Only the marker owner can delete this memory.');
      return;
    }
    
    Alert.alert('Delete Marker', `Delete "${selectedPlace?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlace(selectedPlace.id);
            closeSheet();
            await loadPlaces();
            Alert.alert('Success', 'Marker deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const handleAddFriendToMarker = async (friendId, friendEmail, friendName) => {
    if (!selectedPlace) return;
    
    const validName = friendName && friendName !== 'undefined' 
      ? friendName 
      : (friendEmail ? friendEmail.split('@')[0] : 'Friend');
    
    try {
      await addFriendToMarker(selectedPlace.id, friendId, friendEmail, validName);
      Alert.alert('Success', `${validName} can now see and add to this memory`);
      await loadFriendsList();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add friend');
    }
  };

  const handleDeletePhoto = async (photo) => {
    const currentUser = auth.currentUser;
    
    // Owner can delete ANY photo in their marker
    // Friends can only delete their OWN photos
    if (!isOwner && photo.uploadedBy !== currentUser?.uid) {
      Alert.alert('Cannot Delete', 'Only the marker owner or the person who uploaded this can delete it.');
      return;
    }
    
    Alert.alert('Delete Media', `Delete this ${photo.mediaType === 'video' ? 'video' : 'photo'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhotoFromPlace(selectedPlace.ownerId, selectedPlace.id, photo);
            await loadPlaces();
            if (viewerVisible) setViewerVisible(false);
            Alert.alert('Success', 'Media deleted');
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  const filteredPlaces = places.filter(place => 
    (place.year || new Date().getFullYear()) === selectedYear
  );

  const isVideo = (item) => item.mediaType === 'video' || item.full?.match(/\.(mp4|mov|avi)$/i);

  const isOwner = selectedPlace && selectedPlace.ownerId === auth.currentUser?.uid;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 10.3157,
          longitude: 123.8854,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {filteredPlaces.map((place) => (
          <PlaceMarker key={place.id} place={place} selectedId={selectedPlace?.id} onPress={openSheet} />
        ))}
      </MapView>

      {/* TIME CAPSULE */}
      <View style={styles.timeCapsule}>
        <TouchableOpacity style={styles.yearDown} onPress={() => setSelectedYear(Math.max(minYear, selectedYear - 1))}>
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.year}>{selectedYear}</Text>
        <TouchableOpacity style={styles.yearUp} onPress={() => setSelectedYear(Math.min(maxYear, selectedYear + 1))}>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* ADD BUTTON */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddMarker}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      {/* BOTTOM SHEET */}
      {selectedPlace && (
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              {isEditingTitle ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.titleInput}
                    value={editTitleValue}
                    onChangeText={setEditTitleValue}
                    autoFocus
                    onSubmitEditing={handleRenamePlace}
                  />
                  <TouchableOpacity onPress={handleRenamePlace} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditingTitle(false)} style={styles.cancelEditBtn}>
                    <Text style={styles.cancelEditText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.titleContainer} onPress={() => setIsEditingTitle(true)}>
                    <Text style={styles.title}>{selectedPlace.title}</Text>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeSheet}>
                    <Text style={styles.close}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* YEAR BADGE */}
            <Text style={styles.yearBadge}>📅 {selectedPlace.year || '?'}</Text>
            
            {/* CREATED DATE BADGE */}
            <Text style={styles.dateBadge}>🕒 Created: {formatDate(selectedPlace.createdAt)}</Text>

            {/* OWNER INFO */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👤 Owner:</Text>
              <Text style={styles.infoValue}>{selectedPlace.ownerName || selectedPlace.ownerEmail?.split('@')[0] || 'Unknown'}</Text>
            </View>

            {/* SHARED BY (if not owner) */}
            {!isOwner && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🔗 Shared by:</Text>
                <Text style={styles.infoValue}>{selectedPlace.ownerName || selectedPlace.ownerEmail?.split('@')[0] || 'Friend'}</Text>
              </View>
            )}

            {/* ADD PHOTO BUTTON */}
            <TouchableOpacity style={styles.btnDark} onPress={handleAddPhoto}>
              <Text style={styles.btnText}>📸 Add Photo/Video</Text>
            </TouchableOpacity>

            {/* ADD FRIEND SECTION */}
            <Text style={styles.sectionLabel}>👥 Add Friend to Memory</Text>
            {friendsList.length === 0 ? (
              <Text style={styles.noFriendsText}>No friends yet. Add friends from Friends tab.</Text>
            ) : (
              <FlatList
                horizontal
                data={friendsList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.friendChip} 
                    onPress={() => handleAddFriendToMarker(item.id, item.email, item.displayName || item.email?.split('@')[0])}
                  >
                    <Text style={styles.friendChipText}>+ {item.displayName || item.email?.split('@')[0]}</Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
              />
            )}

            {/* MEMORIES SECTION */}
            <Text style={styles.sectionLabel}>📸 Memories</Text>
            {selectedPlace.photos?.length === 0 ? (
              <Text style={styles.noPhotosText}>No photos or videos yet. Add some!</Text>
            ) : (
              <FlatList
                horizontal
                data={selectedPlace.photos || []}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item, index }) => {
                  const isMine = item.uploadedBy === auth.currentUser?.uid;
                  return (
                    <TouchableOpacity 
                      onPress={() => { setViewerIndex(index); setViewerVisible(true); }} 
                      onLongPress={() => handleDeletePhoto(item)} 
                      delayLongPress={500}
                    >
                      <View>
                        <Image source={{ uri: item.thumb || item.url }} style={styles.photo} />
                        {isVideo(item) && (
                          <View style={styles.videoBadge}>
                            <Text style={styles.videoBadgeText}>🎬</Text>
                          </View>
                        )}
                        {!isMine && !isOwner && (
                          <View style={styles.lockBadge}>
                            <Text style={styles.lockBadgeText}>🔒</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                showsHorizontalScrollIndicator={false}
              />
            )}

            {/* DELETE MARKER BUTTON - ONLY OWNER */}
            {isOwner && (
              <TouchableOpacity onPress={handleDeleteMarker}>
                <Text style={styles.delete}>🗑️ Delete Marker</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* FULLSCREEN VIEWER */}
      <Modal visible={viewerVisible} transparent={false} animationType="fade">
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            data={selectedPlace?.photos || []}
            initialScrollIndex={viewerIndex}
            keyExtractor={(_, i) => i.toString()}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerIndex(newIndex);
            }}
            renderItem={({ item, index }) => {
              const isCurrentVideo = isVideo(item) && viewerIndex === index;
              if (isVideo(item)) {
                return (
                  <View style={styles.videoContainer}>
                    <Video
                      source={{ uri: item.full }}
                      style={styles.fullVideo}
                      useNativeControls={true}
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping={false}
                      shouldPlay={isCurrentVideo && viewerVisible}
                      volume={1.0}
                      isMuted={false}
                      rate={1.0}
                    />
                  </View>
                );
              } else {
                return (
                  <Image source={{ uri: item.full || item.url }} style={styles.fullImage} />
                );
              }
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // TIME CAPSULE
  timeCapsule: { 
    position: 'absolute', 
    top: 20, 
    left: 16, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    borderRadius: 30, 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  yearDown: { paddingHorizontal: 4, paddingVertical: 4 },
  yearUp: { paddingHorizontal: 4, paddingVertical: 4 },
  arrow: { color: '#fff', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 2 },
  year: { color: '#fff', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, minWidth: 45, textAlign: 'center' },

  // ADD BUTTON
  addButton: { 
    position: 'absolute', 
    bottom: 28, 
    alignSelf: 'center', 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#6B3F1D', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  addText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },

  // MARKER
  markerContainer: { width: 56, height: 64, alignItems: 'center', justifyContent: 'center' },
  thumbWrapper: { 
    width: 56, height: 44, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', 
    borderWidth: 2, borderColor: '#fff', marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  pin: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff4444', borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  pinActive: { borderColor: '#6B3F1D', transform: [{ scale: 1.3 }], backgroundColor: '#ff6666' },

  // BOTTOM SHEET
  sheet: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '80%', backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  titleContainer: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1,
    backgroundColor: '#f8f8f8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  title: { fontSize: 18, fontWeight: '700', flex: 1, color: '#1a1a1a' },
  editIcon: { fontSize: 14, color: '#6B3F1D', padding: 4 },
  editContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8, backgroundColor: '#f8f8f8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  titleInput: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, fontSize: 16, flex: 1, borderWidth: 1, borderColor: '#ddd' },
  saveBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelEditBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelEditText: { fontSize: 18, color: '#999' },
  close: { fontSize: 24, padding: 8, color: '#666' },
  
  // BADGES
  yearBadge: { 
    fontSize: 12, color: '#888', marginBottom: 8, backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', fontWeight: '500',
  },
  dateBadge: { 
    fontSize: 11, color: '#999', marginBottom: 12, backgroundColor: '#f8f8f8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start',
  },
  
  // INFO ROWS
  infoRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: '#f8f8f8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#666', width: 65 },
  infoValue: { fontSize: 11, color: '#333', flex: 1 },
  
  // BUTTONS
  btnDark: { 
    backgroundColor: '#6B3F1D', paddingVertical: 14, borderRadius: 14, marginTop: 12,
    shadowColor: '#6B3F1D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  btnText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 12 },
  
  // FRIEND CHIPS
  friendChip: { 
    backgroundColor: '#6B3F1D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, marginRight: 10,
    shadowColor: '#6B3F1D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  friendChipText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  noFriendsText: { color: '#999', fontSize: 14, fontStyle: 'italic', marginBottom: 8, textAlign: 'center', paddingVertical: 20 },
  noPhotosText: { color: '#999', fontSize: 14, fontStyle: 'italic', marginBottom: 8, textAlign: 'center', paddingVertical: 30 },
  
  // PHOTOS
  photo: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  
  // DELETE BUTTON
  delete: { marginTop: 20, textAlign: 'center', color: '#ff4444', fontSize: 15, fontWeight: '600', marginBottom: 10, paddingVertical: 12, backgroundColor: '#fff5f5', borderRadius: 12 },
  
  // BADGES
  videoBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  videoBadgeText: { color: '#fff', fontSize: 12 },
  lockBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 3 },
  lockBadgeText: { color: '#fff', fontSize: 10 },
  
  // VIEWER
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 999, padding: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 },
  viewerCloseText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'contain' },
  videoContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullVideo: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
});
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

  const openSheet = async (place) => {
    console.log('=== OPEN SHEET DEBUG ===');
    console.log('Place ownerId:', place.ownerId);
    console.log('Current user UID:', auth.currentUser?.uid);
    console.log('Is owner?', place.ownerId === auth.currentUser?.uid);
    
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
    if (!selectedPlace) {
      Alert.alert('Error', 'No marker selected');
      return;
    }
    
    // Ensure we have a valid name
    const validName = friendName && friendName !== 'undefined' 
      ? friendName 
      : (friendEmail ? friendEmail.split('@')[0] : 'Friend');
    
    console.log('=== ADD FRIEND DEBUG ===');
    console.log('placeId:', selectedPlace.id);
    console.log('friendId:', friendId);
    console.log('friendEmail:', friendEmail);
    console.log('friendName:', validName);
    console.log('ownerId:', selectedPlace.ownerId);
    
    try {
      await addFriendToMarker(selectedPlace.id, friendId, friendEmail, validName);
      Alert.alert('Success', `${validName} can now see and add to this memory`);
      await loadFriendsList();
    } catch (error) {
      console.error('Add friend error:', error);
      Alert.alert('Error', error.message || 'Failed to add friend');
    }
  };

  const handleDeletePhoto = async (photo) => {
    const currentUser = auth.currentUser;
    
    if (photo.uploadedBy !== currentUser?.uid) {
      Alert.alert('Cannot Delete', 'Only the person who uploaded this can delete it.');
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

      <View style={styles.timeCapsule}>
        <TouchableOpacity onPress={() => setSelectedYear(Math.max(minYear, selectedYear - 1))}>
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.year}>{selectedYear}</Text>
        <TouchableOpacity onPress={() => setSelectedYear(Math.min(maxYear, selectedYear + 1))}>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddMarker}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      {/* BOTTOM SHEET */}
      {selectedPlace && (
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* EDITABLE TITLE */}
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
                  <TouchableOpacity 
                    style={styles.titleContainer}
                    onPress={() => setIsEditingTitle(true)}
                  >
                    <Text style={styles.title}>{selectedPlace.title}</Text>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeSheet}>
                    <Text style={styles.close}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={styles.yearText}>Year: {selectedPlace.year || '?'}</Text>

            {/* DEBUG - Remove after fixing */}
            <Text style={{ fontSize: 10, color: 'red', marginBottom: 5 }}>
              Owner ID: {selectedPlace?.ownerId?.substring(0, 10)} | 
              Current: {auth.currentUser?.uid?.substring(0, 10)} | 
              IsOwner: {isOwner ? 'YES' : 'NO'}
            </Text>

            {/* Add Photo Button - Available to both owner and friends */}
            <TouchableOpacity style={styles.btnDark} onPress={handleAddPhoto}>
              <Text style={styles.btnText}>Add Photo/Video</Text>
            </TouchableOpacity>

            {/* Add Friend Section - ONLY OWNER can add friends */}
            {isOwner && (
              <>
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
                        onPress={() => handleAddFriendToMarker(
                          item.id, 
                          item.email, 
                          item.displayName || item.email?.split('@')[0]
                        )}
                      >
                        <Text style={styles.friendChipText}>+ {item.displayName || item.email?.split('@')[0]}</Text>
                      </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                    ListFooterComponent={<View style={{ width: 10 }} />}
                  />
                )}
              </>
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
                        {!isMine && (
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

            {/* Delete Marker - ONLY OWNER can delete entire marker */}
            {isOwner && (
              <TouchableOpacity onPress={handleDeleteMarker}>
                <Text style={styles.delete}>Delete Marker</Text>
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
  timeCapsule: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    backgroundColor: '#000', 
    borderRadius: 30, 
    flexDirection: 'row', 
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    zIndex: 10 
  },
  arrow: { color: '#fff', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8 },
  year: { color: '#fff', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 8, minWidth: 50, textAlign: 'center' },
  addButton: { 
    position: 'absolute', 
    bottom: 28, 
    alignSelf: 'center', 
    width: 62, 
    height: 62, 
    borderRadius: 31, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  addText: { color: '#fff', fontSize: 28 },
  markerContainer: { width: 48, height: 56, alignItems: 'center', justifyContent: 'center' },
  thumbWrapper: { 
    width: 60, 
    height: 40, 
    borderRadius: 6, 
    overflow: 'hidden', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    marginBottom: 2 
  },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  pin: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ff0000', borderWidth: 2, borderColor: '#fff' },
  pinActive: { borderColor: '#000', transform: [{ scale: 1.15 }] },
  sheet: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    maxHeight: '85%', 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingHorizontal: 14, 
    paddingTop: 10, 
    paddingBottom: 10 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  editIcon: { fontSize: 14, color: '#666' },
  editContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  titleInput: { 
    backgroundColor: '#f2f2f2', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    fontSize: 14, 
    flex: 1 
  },
  saveBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cancelEditBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  cancelEditText: { fontSize: 16, color: '#999' },
  close: { fontSize: 20, padding: 4 },
  yearText: { fontSize: 12, color: '#666', marginBottom: 6 },
  btnDark: { backgroundColor: '#444', paddingVertical: 9, borderRadius: 10, marginTop: 6 },
  btnText: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: '500' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 },
  friendChip: { backgroundColor: '#6B3F1D', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  friendChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  noFriendsText: { color: '#999', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  noPhotosText: { color: '#999', fontSize: 12, fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  photo: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#eee', marginRight: 8 },
  delete: { marginTop: 8, textAlign: 'center', color: 'red', fontSize: 13, marginBottom: 20 },
  videoBadge: { 
    position: 'absolute', 
    bottom: 4, 
    right: 4, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 12, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  videoBadgeText: { color: '#fff', fontSize: 12 },
  lockBadge: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 12, 
    paddingHorizontal: 6, 
    paddingVertical: 2 
  },
  lockBadgeText: { color: '#fff', fontSize: 10 },
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerClose: { position: 'absolute', top: 50, right: 25, zIndex: 999, padding: 10 },
  viewerCloseText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'contain' },
  videoContainer: { 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT, 
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullVideo: { 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT, 
    backgroundColor: '#000',
  },
});
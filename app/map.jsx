import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Dimensions,
  Alert,
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
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newTitle, setNewTitle] = useState('');
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

  const openSheet = async (place) => {
    setSelectedPlace(place);
    setNewTitle(place.title || '');
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
    setNewTitle('');
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
      await addPhotoToPlace(selectedPlace.id, photo);
      await loadPlaces();
    } catch (e) {
      Alert.alert('Error', 'Failed to add photo');
    }
  };

  const handleRename = async () => {
    if (!selectedPlace || !newTitle) return;
    try {
      await renamePlace(selectedPlace.id, newTitle);
      await loadPlaces();
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
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const handleAddFriendToMarker = async (friendId, friendEmail, friendName) => {
    if (!selectedPlace) return;
    try {
      await addFriendToMarker(selectedPlace.id, friendId, friendEmail, friendName);
      Alert.alert('Success', `${friendName} can now see and add to this memory`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add friend');
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
            await deletePhotoFromPlace(selectedPlace.id, photo);
            await loadPlaces();
            if (viewerVisible) setViewerVisible(false);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const filteredPlaces = places.filter(place => 
    (place.year || new Date().getFullYear()) === selectedYear
  );

  const isVideo = (item) => item.mediaType === 'video' || item.full?.match(/\.(mp4|mov|avi)$/i);

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

      {selectedPlace && (
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{selectedPlace.title}</Text>
            <TouchableOpacity onPress={closeSheet}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <Text style={styles.yearText}>Year: {selectedPlace.year || '?'}</Text>
          <TextInput value={newTitle} onChangeText={setNewTitle} style={styles.input} placeholder="Rename" />

          <TouchableOpacity style={styles.btn} onPress={handleRename}><Text style={styles.btnText}>Rename</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnDark} onPress={handleAddPhoto}><Text style={styles.btnText}>Add Photo/Video</Text></TouchableOpacity>

          <Text style={styles.sectionLabel}>👥 Add Friend to Memory</Text>
          {friendsList.length === 0 ? (
            <Text style={styles.noFriendsText}>No friends yet. Add friends from Friends tab.</Text>
          ) : (
            <FlatList
              horizontal
              data={friendsList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.friendChip} onPress={() => handleAddFriendToMarker(item.id, item.email, item.displayName)}>
                  <Text style={styles.friendChipText}>+ {item.displayName}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          <Text style={styles.sectionLabel}>📸 Memories</Text>
          <FlatList
            horizontal
            data={selectedPlace.photos || []}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const isMine = item.uploadedBy === auth.currentUser?.uid;
              return (
                <TouchableOpacity onPress={() => { setViewerIndex(index); setViewerVisible(true); }} onLongPress={() => handleDeletePhoto(item)} delayLongPress={500}>
                  <View>
                    <Image source={{ uri: item.thumb || item.url }} style={styles.photo} />
                    {isVideo(item) && <View style={styles.videoBadge}><Text style={styles.videoBadgeText}>🎬</Text></View>}
                    {!isMine && <View style={styles.lockBadge}><Text style={styles.lockBadgeText}>🔒</Text></View>}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity onPress={handleDeleteMarker}><Text style={styles.delete}>Delete Marker</Text></TouchableOpacity>
        </View>
      )}

      <Modal visible={viewerVisible} transparent={false} animationType="fade">
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}><Text style={styles.viewerCloseText}>✕</Text></TouchableOpacity>
          <FlatList
            horizontal pagingEnabled
            data={selectedPlace?.photos || []}
            initialScrollIndex={viewerIndex}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              if (isVideo(item)) {
                return (
                  <View style={styles.videoContainer}>
                    <Video source={{ uri: item.full }} style={styles.fullVideo} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay={false} />
                  </View>
                );
              }
              return <Image source={{ uri: item.full || item.url }} style={styles.fullImage} />;
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
  timeCapsule: { position: 'absolute', top: 10, right: 10, backgroundColor: '#000', borderRadius: 30, flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, zIndex: 10 },
  arrow: { color: '#fff', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8 },
  year: { color: '#fff', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 8, minWidth: 50, textAlign: 'center' },
  addButton: { position: 'absolute', bottom: 28, alignSelf: 'center', width: 62, height: 62, borderRadius: 31, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#fff', fontSize: 28 },
  markerContainer: { width: 48, height: 56, alignItems: 'center', justifyContent: 'center' },
  thumbWrapper: { width: 60, height: 40, borderRadius: 6, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginBottom: 2 },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  pin: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ff0000', borderWidth: 2, borderColor: '#fff' },
  pinActive: { borderColor: '#000', transform: [{ scale: 1.15 }] },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '70%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: 'bold' },
  close: { fontSize: 20 },
  yearText: { fontSize: 12, color: '#666', marginBottom: 6 },
  input: { backgroundColor: '#f2f2f2', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, fontSize: 13, marginTop: 6 },
  btn: { backgroundColor: '#000', paddingVertical: 9, borderRadius: 10, marginTop: 8 },
  btnDark: { backgroundColor: '#444', paddingVertical: 9, borderRadius: 10, marginTop: 6 },
  btnText: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: '500' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 },
  friendChip: { backgroundColor: '#6B3F1D', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  friendChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  noFriendsText: { color: '#999', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  photo: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#eee', marginRight: 8 },
  delete: { marginTop: 8, textAlign: 'center', color: 'red', fontSize: 13 },
  videoBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  videoBadgeText: { color: '#fff', fontSize: 12 },
  lockBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  lockBadgeText: { color: '#fff', fontSize: 10 },
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 50, right: 25, zIndex: 999 },
  viewerCloseText: { color: '#fff', fontSize: 28 },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'contain' },
  videoContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  fullVideo: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
});
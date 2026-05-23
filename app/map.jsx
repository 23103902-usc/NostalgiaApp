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
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import {
  getPlaces,
  addPlace,
  deletePlace,
  renamePlace,
} from '../src/services/places';

import { pickAndUploadPhoto } from '../src/services/pickAndUploadPhoto';

const SCREEN_WIDTH = Dimensions.get('window').width;

/* =========================
   MARKER
========================= */
const PlaceMarker = React.memo(({ place, onPress, selectedId }) => {
  const isSelected = selectedId === place.id;
  const [loaded, setLoaded] = useState(false);

  return (
    <Marker
      coordinate={{
        latitude: place.latitude,
        longitude: place.longitude,
      }}
      onPress={() => onPress(place)}
      tracksViewChanges={!loaded}
    >
      <View style={styles.markerContainer} pointerEvents="none">

        {!!place.photos?.[0]?.url && (
          <View style={styles.thumbWrapper}>
            <Image
              source={{ uri: place.photos[0].url }}
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

/* =========================
   MAIN SCREEN
========================= */
export default function MapScreen() {
  const mapRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  /* viewer state */
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const selectedId = selectedPlace?.id;

  /* LOAD */
  const loadPlaces = async () => {
    const data = await getPlaces();
    setPlaces(data);
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  /* OPEN SHEET */
  const openSheet = (place) => {
    setSelectedPlace(place);
    setNewTitle(place.title || '');

    mapRef.current?.animateToRegion({
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const closeSheet = () => {
    setSelectedPlace(null);
    setNewTitle('');
  };

  /* PHOTO VIEWER */
  const openPhotoViewer = (index) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  /* ACTIONS */
  const handleAddMarker = async () => {
    const camera = await mapRef.current.getCamera();

    await addPlace(
      camera.center.latitude,
      camera.center.longitude
    );

    loadPlaces();
  };

  const handleAddPhoto = async () => {
    if (!selectedPlace) return;

    await pickAndUploadPhoto(selectedPlace.id);
    loadPlaces();
  };

  const handleRename = async () => {
    if (!selectedPlace || !newTitle) return;

    await renamePlace(selectedPlace.id, newTitle);
    loadPlaces();
  };

  const handleDelete = async () => {
    if (!selectedPlace) return;

    await deletePlace(selectedPlace.id);
    closeSheet();
    loadPlaces();
  };

  return (
    <View style={styles.container}>

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 10.3157,
          longitude: 123.8854,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        moveOnMarkerPress={false}
        tracksViewChanges={false}
      >
        {places.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            selectedId={selectedId}
            onPress={openSheet}
          />
        ))}
      </MapView>

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMarker}
      >
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      {/* =========================
          BOTTOM SHEET
      ========================= */}
      {selectedPlace && (
        <View style={styles.sheet}>

          <View style={styles.header}>
            <Text style={styles.title}>
              {selectedPlace.title}
            </Text>

            <TouchableOpacity onPress={closeSheet}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            style={styles.input}
            placeholder="Rename place"
          />

          <TouchableOpacity style={styles.btn} onPress={handleRename}>
            <Text style={styles.btnText}>Rename</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDark} onPress={handleAddPhoto}>
            <Text style={styles.btnText}>Add Photo</Text>
          </TouchableOpacity>

          {/* THUMBNAILS */}
          <FlatList
            horizontal
            data={selectedPlace.photos || []}
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => openPhotoViewer(index)}>
                <Image source={{ uri: item.url }} style={styles.photo} />
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.delete}>Delete Marker</Text>
          </TouchableOpacity>

        </View>
      )}

      {/* =========================
          FULLSCREEN SWIPE VIEWER
      ========================= */}
      <Modal visible={viewerVisible} transparent={false}>
        <View style={styles.viewerContainer}>

          {/* CLOSE */}
          <TouchableOpacity
            style={styles.closeViewer}
            onPress={() => setViewerVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          {/* SWIPE */}
          <FlatList
            data={selectedPlace?.photos || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setViewerIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.fullImageContainer}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.fullImage}
                />
              </View>
            )}
          />

        </View>
      </Modal>

    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  addButton: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addText: {
    color: '#fff',
    fontSize: 28,
  },

  /* MARKER */
  markerContainer: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbWrapper: {
    width: 38,
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 2,
  },

  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  pin: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#999',
  },

  pinActive: {
    borderColor: '#000',
    transform: [{ scale: 1.15 }],
  },

  /* SHEET */
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 14,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  close: {
    fontSize: 20,
  },

  input: {
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 10,
    marginTop: 6,
  },

  btn: {
    backgroundColor: '#000',
    padding: 9,
    borderRadius: 10,
    marginTop: 8,
  },

  btnDark: {
    backgroundColor: '#444',
    padding: 9,
    borderRadius: 10,
    marginTop: 6,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
  },

  photo: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },

  delete: {
    marginTop: 8,
    textAlign: 'center',
    color: 'red',
  },

  /* VIEWER */
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  fullImageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullImage: {
    width: SCREEN_WIDTH,
    height: '80%',
    resizeMode: 'contain',
  },

  closeViewer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
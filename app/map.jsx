import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import {
  getPlaces,
  addPlace,
  deletePlace,
  renamePlace,
} from '../src/services/places';

import { pickAndUploadPhoto } from '../src/services/pickAndUploadPhoto';

export default function MapScreen() {
  const mapRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // 📥 LOAD PLACES
  const loadPlaces = async () => {
    const data = await getPlaces();
    setPlaces(data);
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  // 📍 ADD MARKER (CENTER OF MAP)
  const handleAddMarker = async () => {
    if (!mapRef.current) return;

    const camera = await mapRef.current.getCamera();

    await addPlace(
      camera.center.latitude,
      camera.center.longitude
    );

    loadPlaces();
  };

  // 🖼 ADD PHOTO (FIXED)
  const handleAddPhoto = async () => {
    if (!selectedPlace) return;

    await pickAndUploadPhoto(selectedPlace.id);

    await loadPlaces();
  };

  // ✏️ RENAME MARKER
  const handleRename = async () => {
    if (!selectedPlace || !newTitle) return;

    await renamePlace(selectedPlace.id, newTitle);

    loadPlaces();
  };

  // 🗑 DELETE MARKER
  const handleDelete = async () => {
    if (!selectedPlace) return;

    await deletePlace(selectedPlace.id);

    setSelectedPlace(null);
    setNewTitle('');

    loadPlaces();
  };

  // 📌 SELECT MARKER
  const onMarkerPress = (place) => {
    setSelectedPlace(place);
    setNewTitle(place.title || '');
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
      >
        {places.map((place) => {
          const thumbnail = place.photos?.[0]?.url;

          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              onPress={() => onMarkerPress(place)}
            >
              <View style={styles.markerContainer}>

                {thumbnail && (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.markerImage}
                  />
                )}

                <View style={styles.pin} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* CROSSHAIR */}
      <View style={styles.crosshair} />

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMarker}
      >
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      {/* BOTTOM PANEL */}
      {selectedPlace && (
        <View style={styles.panel}>

          <Text style={styles.title}>
            {selectedPlace.title}
          </Text>

          <TextInput
            placeholder="Rename marker"
            value={newTitle}
            onChangeText={setNewTitle}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={handleRename}
          >
            <Text style={styles.btnText}>Rename</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoBtn}
            onPress={handleAddPhoto}
          >
            <Text style={styles.btnText}>Add Photo</Text>
          </TouchableOpacity>

          <FlatList
            horizontal
            data={selectedPlace.photos || []}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.photo}
              />
            )}
            style={{ marginTop: 10 }}
          />

          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>
              Delete Marker
            </Text>
          </TouchableOpacity>

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 20,
  },

  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },

  markerContainer: {
    alignItems: 'center',
  },

  markerImage: {
    width: 70,
    height: 50,
    borderRadius: 10,
    marginBottom: 5,
  },

  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: 'white',
  },

  panel: {
    position: 'absolute',
    bottom: 110,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  input: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  btn: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  photoBtn: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  btnText: {
    color: 'white',
    textAlign: 'center',
  },

  photo: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },

  deleteText: {
    marginTop: 12,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
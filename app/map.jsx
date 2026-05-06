import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import {
  getPlaces,
  addPlace,
  deletePlace,
  renamePlace,
} from '../src/services/places';

export default function MapScreen() {
  const mapRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // 📥 LOAD MARKERS
  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    const data = await getPlaces();
    setPlaces(data);
  };

  // 📍 SELECT MARKER
  const onMarkerPress = (place) => {
    setSelectedPlace(place);
    setNewTitle(place.title || '');
  };

  // ➕ ADD MARKER
  const handleAddMarker = async () => {
    if (!mapRef.current) return;

    const camera = await mapRef.current.getCamera();

    await addPlace(
      camera.center.latitude,
      camera.center.longitude
    );

    loadPlaces();
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
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => onMarkerPress(place)}
          />
        ))}
      </MapView>

      {/* ➕ ADD MARKER */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddMarker}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      {/* 📦 PANEL */}
      {selectedPlace && (
        <View style={styles.panel}>

          {/* TITLE */}
          <Text style={styles.title}>
            {selectedPlace.title}
          </Text>

          {/* RENAME INPUT */}
          <TextInput
            placeholder="Rename marker"
            value={newTitle}
            onChangeText={setNewTitle}
            style={styles.input}
          />

          <TouchableOpacity style={styles.btn} onPress={handleRename}>
            <Text style={styles.btnText}>Rename</Text>
          </TouchableOpacity>

          {/* DELETE */}
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Marker</Text>
          </TouchableOpacity>

        </View>
      )}

    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 65,
    height: 65,
    borderRadius: 32,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addText: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
  },

  panel: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
  },

  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  input: {
    backgroundColor: '#eee',
    padding: 8,
    marginTop: 10,
    borderRadius: 6,
  },

  btn: {
    backgroundColor: 'black',
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
  },

  btnText: {
    color: 'white',
    textAlign: 'center',
  },

  deleteText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
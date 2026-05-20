
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

import * as ImagePicker from 'expo-image-picker';

import {
  getPlaces,
  addPlace,
  deletePlace,
  renamePlace,
  addPhotoToPlace,
} from '../src/services/places';

import { uploadMedia } from '../src/services/cloudinary';

export default function MapScreen() {
  const mapRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    const data = await getPlaces();
    setPlaces(data);
  };

  const onMarkerPress = (place) => {
    setSelectedPlace(place);
    setNewTitle(place.title || '');
  };

  const handleAddMarker = async () => {
    if (!mapRef.current) return;

    const camera = await mapRef.current.getCamera();

    await addPlace(
      camera.center.latitude,
      camera.center.longitude
    );

    loadPlaces();
  };

  const handleRename = async () => {
    if (!selectedPlace || !newTitle) return;

    await renamePlace(selectedPlace.id, newTitle);

    loadPlaces();
  };

  const handleDeleteMarker = async () => {
    if (!selectedPlace) return;

    await deletePlace(selectedPlace.id);

    setSelectedPlace(null);
    setNewTitle('');

    loadPlaces();
  };

  const handleAddPhoto = async () => {
    if (!selectedPlace) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert('Permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (result.canceled) return;

    try {
      const imageUri = result.assets[0].uri;

      const uploadedUrl = await uploadMedia(imageUri, 'image');

      await addPhotoToPlace(
        selectedPlace.id,
        uploadedUrl,
        'image'
      );

      await loadPlaces();

      const updatedPlaces = await getPlaces();

      const updatedPlace = updatedPlaces.find(
        (p) => p.id === selectedPlace.id
      );

      setSelectedPlace(updatedPlace);

    } catch (e) {
      console.log(e);
      alert('Upload failed');
    }
  };

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
                    style={styles.markerThumbnail}
                  />
                )}

                <View style={styles.pin} />

              </View>

            </Marker>
          );
        })}

      </MapView>

      <View style={styles.crosshair} />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMarker}
      >
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

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
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.photo}
              />
            )}
            style={{ marginTop: 10 }}
          />

          <TouchableOpacity onPress={handleDeleteMarker}>
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
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    top: '50%',
    left: '50%',
    marginLeft: -11,
    marginTop: -11,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  addButton: {
    position: 'absolute',
    bottom: 25,
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
    fontSize: 34,
    fontWeight: 'bold',
  },

  markerContainer: {
    alignItems: 'center',
  },

  markerThumbnail: {
    width: 70,
    height: 50,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#eee',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'red',
    borderWidth: 3,
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

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },

  btn: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  photoBtn: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  btnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },

  photo: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 10,
  },

  deleteText: {
    marginTop: 14,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

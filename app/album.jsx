import React, { useEffect, useState } from 'react';

import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
} from 'react-native';

import { getPlaces } from '../src/services/places';

export default function AlbumScreen() {

  const [photos, setPhotos] = useState([]);

  // LOAD PHOTOS FROM FIRESTORE
  const loadPhotos = async () => {

    try {

      const places = await getPlaces();

      const allPhotos = [];

      places.forEach((place) => {

        // if place has photos
        if (place.photos) {

          place.photos.forEach((photo) => {

            allPhotos.push(photo);

          });

        }

      });

      setPhotos(allPhotos);

    } catch (e) {

      console.log('ALBUM ERROR:', e);

    }

  };

  useEffect(() => {

    loadPhotos();

  }, []);

  return (
    <View style={styles.container}>

      {/* EMPTY */}
      {photos.length === 0 ? (

        <View style={styles.emptyContainer}>

          <Text style={styles.emptyText}>
            No uploaded photos yet
          </Text>

        </View>

      ) : (

        // PHOTO GRID
        <FlatList
          data={photos}
          numColumns={3}
          keyExtractor={(_, index) =>
            index.toString()
          }
          renderItem={({ item }) => (

            <Image
              source={{ uri: item.url }}
              style={styles.image}
            />

          )}
        />

      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 5,
  },

  image: {
    width: 115,
    height: 115,
    margin: 3,
    borderRadius: 12,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    color: 'gray',
    fontSize: 16,
  },

});
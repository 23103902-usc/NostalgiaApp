import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getPlaces } from '../src/services/places';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AlbumScreen() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = async () => {
    try {
      const places = await getPlaces();
      const allPhotos = [];
      places.forEach((place) => {
        if (place.photos) {
          place.photos.forEach((photo) => {
            allPhotos.push(photo);
          });
        }
      });
      setPhotos(allPhotos);
    } catch (e) {
      console.log('ALBUM ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B3F1D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No uploaded photos yet</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={3}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <Image source={{ uri: item.thumb || item.full }} style={styles.image} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
  image: { 
    width: (SCREEN_WIDTH / 3) - 8, 
    height: (SCREEN_WIDTH / 3) - 8, 
    margin: 4, 
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16, fontStyle: 'italic' },
});
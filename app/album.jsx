import React from 'react';
import { View, Image, FlatList, StyleSheet } from 'react-native';
import { places } from '../data/places';

export default function AlbumScreen() {
  const allPhotos = places.flatMap(p => p.photos);

  return (
    <View style={styles.container}>
      <FlatList
        data={allPhotos}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={styles.image} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 5 },
  image: {
    width: 110,
    height: 110,
    margin: 3,
    borderRadius: 10,
  },
});
import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { getAllPlaces } from '../src/services/places';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AlbumScreen() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const loadMedia = async () => {
    try {
      const places = await getAllPlaces();
      const allMedia = [];
      
      places.forEach((place) => {
        if (place.photos && place.photos.length > 0) {
          place.photos.forEach((photo) => {
            allMedia.push({
              ...photo,
              placeTitle: place.title,
              placeYear: place.year,
            });
          });
        }
      });
      
      // Sort by createdAt (newest first)
      allMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setMediaItems(allMedia);
    } catch (e) {
      console.log('ALBUM ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const isVideo = (item) => item.mediaType === 'video' || item.full?.match(/\.(mp4|mov|avi|webm)$/i);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B3F1D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mediaItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No photos or videos yet</Text>
          <Text style={styles.emptySubtext}>Add memories from the map screen</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={mediaItems}
            numColumns={3}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={styles.mediaItem}
                onPress={() => {
                  setViewerIndex(index);
                  setViewerVisible(true);
                }}
              >
                <Image source={{ uri: item.thumb || item.full }} style={styles.thumbnail} />
                {isVideo(item) && (
                  <View style={styles.videoIcon}>
                    <Text style={styles.videoIconText}>🎬</Text>
                  </View>
                )}
                <View style={styles.placeInfo}>
                  <Text style={styles.placeTitle} numberOfLines={1}>{item.placeTitle}</Text>
                  <Text style={styles.placeYear}>📅 {item.placeYear || '?'}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* FULLSCREEN VIEWER */}
          <Modal visible={viewerVisible} transparent={false} animationType="fade">
            <View style={styles.viewerContainer}>
              <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
                <Text style={styles.viewerCloseText}>✕</Text>
              </TouchableOpacity>
              
              <FlatList
                horizontal
                pagingEnabled
                data={mediaItems}
                initialScrollIndex={viewerIndex}
                keyExtractor={(_, i) => i.toString()}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setViewerIndex(newIndex);
                }}
                renderItem={({ item }) => {
                  if (isVideo(item)) {
                    return (
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: item.full }}
                          style={styles.fullVideo}
                          useNativeControls={true}
                          resizeMode={ResizeMode.CONTAIN}
                          isLooping={false}
                          shouldPlay={viewerVisible}
                          volume={1.0}
                          isMuted={false}
                          rate={1.0}
                        />
                        <View style={styles.mediaInfoOverlay}>
                          <Text style={styles.mediaInfoTitle}>{item.placeTitle}</Text>
                          <Text style={styles.mediaInfoYear}>📅 {item.placeYear || '?'}</Text>
                        </View>
                      </View>
                    );
                  } else {
                    return (
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: item.full }} style={styles.fullImage} />
                        <View style={styles.mediaInfoOverlay}>
                          <Text style={styles.mediaInfoTitle}>{item.placeTitle}</Text>
                          <Text style={styles.mediaInfoYear}>📅 {item.placeYear || '?'}</Text>
                        </View>
                      </View>
                    );
                  }
                }}
              />
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f8f8', 
    padding: 4,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8f8f8' 
  },
  mediaItem: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: { 
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
  },
  videoIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoIconText: {
    color: '#fff',
    fontSize: 12,
  },
  placeInfo: {
    padding: 8,
    backgroundColor: '#fff',
  },
  placeTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  placeYear: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    color: '#999', 
    fontSize: 16, 
    fontStyle: 'italic' 
  },
  emptySubtext: {
    color: '#bbb',
    fontSize: 12,
    marginTop: 8,
  },
  viewerContainer: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  viewerClose: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    zIndex: 999, 
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
  },
  viewerCloseText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  fullImage: { 
    width: SCREEN_WIDTH, 
    height: SCREEN_HEIGHT, 
    resizeMode: 'contain' 
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
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
  mediaInfoOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    alignItems: 'center',
  },
  mediaInfoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaInfoYear: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
});
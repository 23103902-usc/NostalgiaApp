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
  Animated,
  PanResponder,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import {
  getPlaces,
  addPlace,
  deletePlace,
  renamePlace,
} from '../src/services/places';

import { pickAndUploadPhoto } from '../src/services/pickAndUploadPhoto';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

/* =========================
   SNAP POINTS
========================= */
const SNAP_TOP = 120;
const SNAP_MID = SCREEN_HEIGHT * 0.5;
const SNAP_BOTTOM = SCREEN_HEIGHT - 80;

/* =========================
   MARKER
========================= */
const PlaceMarker = React.memo(({ place, onPress }) => {
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

        <View style={styles.pin} />

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

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  /* ✅ YEAR FILTER */
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const pan = useRef(
    new Animated.Value(SNAP_BOTTOM)
  ).current;

  const clamp = (v, min, max) =>
    Math.min(Math.max(v, min), max);

  /* =========================
     LOAD DATA
  ========================= */
  const loadPlaces = async () => {
    const data = await getPlaces();
    setPlaces(data);
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  /* =========================
     OPEN SHEET
  ========================= */
  const openSheet = (place) => {
    setSelectedPlace(place);
    setNewTitle(place.title || '');

    Animated.spring(pan, {
      toValue: SNAP_MID,
      useNativeDriver: false,
    }).start();

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

    Animated.spring(pan, {
      toValue: SNAP_BOTTOM,
      useNativeDriver: false,
    }).start();
  };

  /* =========================
     DRAG SHEET
  ========================= */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: (_, gesture) => {
        pan.setValue(
          clamp(
            gesture.moveY,
            SNAP_TOP,
            SNAP_BOTTOM
          )
        );
      },

      onPanResponderRelease: (_, gesture) => {
        const y = gesture.moveY;

        let snapTo = SNAP_BOTTOM;

        if (y < SCREEN_HEIGHT * 0.3) {
          snapTo = SNAP_TOP;
        } else if (y < SCREEN_HEIGHT * 0.65) {
          snapTo = SNAP_MID;
        } else {
          snapTo = SNAP_BOTTOM;
        }

        Animated.spring(pan, {
          toValue: snapTo,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  /* =========================
     ACTIONS
  ========================= */
  const handleAddMarker = async () => {
    const camera =
      await mapRef.current.getCamera();

    await addPlace(
      camera.center.latitude,
      camera.center.longitude
    );

    loadPlaces();
  };

  const handleAddPhoto = async () => {
    if (!selectedPlace) return;

    await pickAndUploadPhoto(
      selectedPlace.id
    );

    loadPlaces();
  };

  const handleRename = async () => {
    if (!selectedPlace || !newTitle) return;

    await renamePlace(
      selectedPlace.id,
      newTitle
    );

    loadPlaces();
  };

  const handleDelete = async () => {
    if (!selectedPlace) return;

    await deletePlace(selectedPlace.id);

    closeSheet();

    loadPlaces();
  };

  /* =========================
     UI
  ========================= */
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
        tracksViewChanges={false}
      >

        {/* ✅ FILTER BY YEAR */}
        {places
          .filter(
            (place) =>
              (place.year || 2026) ===
              selectedYear
          )
          .map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              onPress={openSheet}
            />
          ))}

      </MapView>

      {/* =========================
          YEAR FILTER
      ========================= */}
      <View style={styles.yearBar}>

        {[2024, 2025, 2026].map(
          (year) => (

            <TouchableOpacity
              key={year}
              onPress={() =>
                setSelectedYear(year)
              }
              style={[
                styles.yearBtn,

                selectedYear === year &&
                  styles.yearBtnActive,
              ]}
            >

              <Text
                style={[
                  styles.yearText,

                  selectedYear ===
                    year && {
                    color: '#000',
                  },
                ]}
              >
                {year}
              </Text>

            </TouchableOpacity>

          )
        )}

      </View>

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMarker}
      >
        <Text style={styles.addText}>
          +
        </Text>
      </TouchableOpacity>

      {/* =========================
          BOTTOM SHEET
      ========================= */}
      {selectedPlace && (
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                { translateY: pan },
              ],
            },
          ]}
        >

          {/* DRAG AREA */}
          <View
            {...panResponder.panHandlers}
            style={styles.dragArea}
          >
            <View style={styles.handle} />
          </View>

          {/* HEADER */}
          <View style={styles.header}>

            <View>
              <Text style={styles.title}>
                {selectedPlace.title}
              </Text>

              {/* ✅ YEAR */}
              <Text style={styles.yearLabel}>
                📅{' '}
                {selectedPlace.year ||
                  2026}
              </Text>
            </View>

            <TouchableOpacity
              onPress={closeSheet}
            >
              <Text style={styles.close}>
                ✕
              </Text>
            </TouchableOpacity>

          </View>

          {/* INPUT */}
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            style={styles.input}
          />

          {/* BUTTONS */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleRename}
          >
            <Text style={styles.btnText}>
              Rename
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnDark}
            onPress={handleAddPhoto}
          >
            <Text style={styles.btnText}>
              Add Photo
            </Text>
          </TouchableOpacity>

          {/* PHOTOS */}
          <FlatList
            horizontal
            data={
              selectedPlace.photos || []
            }
            keyExtractor={(_, i) =>
              i.toString()
            }
            renderItem={({
              item,
              index,
            }) => (
              <TouchableOpacity
                onPress={() => {
                  setViewerIndex(index);
                  setViewerVisible(true);
                }}
              >
                <Image
                  source={{
                    uri: item.url,
                  }}
                  style={styles.photo}
                />
              </TouchableOpacity>
            )}
          />

          {/* DELETE */}
          <TouchableOpacity
            onPress={handleDelete}
          >
            <Text style={styles.delete}>
              Delete Marker
            </Text>
          </TouchableOpacity>

        </Animated.View>
      )}

      {/* =========================
          FULLSCREEN VIEWER
      ========================= */}
      <Modal
        visible={viewerVisible}
        transparent={false}
      >

        <View style={styles.viewerContainer}>

          <TouchableOpacity
            style={styles.closeViewer}
            onPress={() =>
              setViewerVisible(false)
            }
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 22,
              }}
            >
              ✕
            </Text>
          </TouchableOpacity>

          <FlatList
            data={
              selectedPlace?.photos || []
            }
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={
              false
            }
            initialScrollIndex={
              viewerIndex
            }
            getItemLayout={(_, i) => ({
              length: SCREEN_WIDTH,
              offset:
                SCREEN_WIDTH * i,
              index: i,
            })}
            keyExtractor={(_, i) =>
              i.toString()
            }
            renderItem={({ item }) => (
              <View
                style={
                  styles.fullscreenSlide
                }
              >
                <Image
                  source={{
                    uri: item.url,
                  }}
                  style={
                    styles.fullscreenImage
                  }
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
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  /* YEAR BAR */
  yearBar: {
    position: 'absolute',
    top: 55,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor:
      'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },

  yearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginHorizontal: 3,
  },

  yearBtnActive: {
    backgroundColor: '#fff',
  },

  yearText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  yearLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  /* ADD BUTTON */
  addButton: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addText: {
    color: '#fff',
    fontSize: 26,
  },

  /* MARKER */
  markerContainer: {
    width: 38,
    height: 48,
    alignItems: 'center',
  },

  thumbWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 3,
  },

  thumb: {
    width: '100%',
    height: '100%',
  },

  pin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#999',
  },

  /* SHEET */
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 12,
  },

  dragArea: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  handle: {
    width: 44,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  title: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  close: {
    fontSize: 18,
  },

  input: {
    backgroundColor: '#f2f2f2',
    padding: 7,
    borderRadius: 8,
    marginTop: 6,
  },

  btn: {
    backgroundColor: '#000',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },

  btnDark: {
    backgroundColor: '#444',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 5,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },

  photo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 10,
    marginBottom: 10,
  },

  delete: {
    marginTop: 6,
    textAlign: 'center',
    color: 'red',
    fontSize: 12,
  },

  /* VIEWER */
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  fullscreenSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'contain',
  },

  closeViewer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
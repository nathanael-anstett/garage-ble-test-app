import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Header, SideMenu } from '../components';

const MapScreen = () => {
  const markers = [
    {
      id: 1,
      coordinate: {
        latitude: 46.1769,
        longitude: 6.1053,
      },
      title: 'Bernex A',
      description: 'Description marqueur A',
    },
    {
      id: 2,
      coordinate: {
        latitude: 46.1780,
        longitude: 6.1070,
      },
      title: 'Bernex B',
      description: 'Description marqueur B',
    },
    {
      id: 3,
      coordinate: {
        latitude: 46.1750,
        longitude: 6.1030,
      },
      title: 'Bernex C',
      description: 'Description marqueur C',
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="" />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 46.1769,
          longitude: 6.1053,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </MapView>
      <SideMenu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;

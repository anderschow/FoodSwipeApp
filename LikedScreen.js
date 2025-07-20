import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet , TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LikedScreen() {
  const [likedPlaces, setLikedPlaces] = useState([]);

  useEffect(() => {
    const loadLikes = async () => {
      try {
        const json = await AsyncStorage.getItem('liked_places');
        if (json) {
          setLikedPlaces(JSON.parse(json));
        }
      } catch (err) {
        console.error('Failed to load liked places:', err);
      }
    };

    loadLikes();
  }, []);

  const clearLikes = async () => {
    try {
      await AsyncStorage.removeItem('liked_places');
      setLikedPlaces([]);
    } catch (err) {
      console.error('Failed to clear liked places:', err);
    }
  };

  if (likedPlaces.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No liked restaurants yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.clearButton} onPress={clearLikes}>
        <Text style={styles.clearButtonText}>Clear List</Text>
      </TouchableOpacity>

    <ScrollView contentContainerStyle={styles.container}>
      {likedPlaces.map((place, index) => (
        <View key={index} style={styles.card}>
          <Image source={{ uri: place.image }} style={styles.image} />
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.address}>{place.address}</Text>
        </View>
      ))}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 8,
  },
  address: {
    fontSize: 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
    color: '#666',
  },
});
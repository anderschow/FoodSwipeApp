import React from 'react';
import * as Location from 'expo-location';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SwipeScreen({navigation}) {
    const [location, setLocation] = React.useState(null);
    const [errorMsg, setErrorMsg] = React.useState(null);
    const [generalArea, setGeneralArea] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const position = React.useRef(new Animated.ValueXY()).current;
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [cards, setCards] = React.useState([]);
    const [panResponder, setPanResponder] = React.useState(null);

    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
    });

    React.useEffect(() => {

        const responder = PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > 120) {
                    Animated.spring(position, {
                        toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
                        useNativeDriver: false,
                    }).start(() => {
                        handleSwipe('right');
                    });
                } else if (gesture.dx < -120) {
                    Animated.spring(position, {
                        toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
                        useNativeDriver: false,
                    }).start(() => {
                        handleSwipe('left');
                    });
                } else {
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                }
            },
        });

        setPanResponder(responder);
    }, [cards, currentIndex]);

    const handleSwipe = async (direction) => {
        const swipedCard = cards[currentIndex];
        position.setValue({ x: 0, y: 0 });

        if (swipedCard && direction === 'right') {
            const existing = await AsyncStorage.getItem('liked_places');
            const liked = existing ? JSON.parse(existing) : [];
            liked.push(swipedCard);
            await AsyncStorage.setItem('liked_places', JSON.stringify(liked));
        }
        setCurrentIndex((prev) => prev + 1);
    };

    const renderCards = () => {
        if (currentIndex >= cards.length) {
            return (
                <View style={[styles.card, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>No more restaurants!</Text>
                </View>
            );
        }

        return cards
            .map((card, i) => {
                if (i < currentIndex) {
                    return null;
                }

                const isTopCard = i === currentIndex;
                const cardStyle = isTopCard
                    ? {
                        ...styles.card,
                        transform: [
                            { translateX: position.x },
                            { translateY: position.y },
                            { rotate: rotate },
                        ],
                    }
                    : {
                        ...styles.card,
                        top: 10 * (i - currentIndex),
                        zIndex: -i,
                    };

                return (
                    <Animated.View
                        key={card.id}
                        style={cardStyle}
                        {...(isTopCard && panResponder ? panResponder.panHandlers : {})}
                    >
                        <Image source={{ uri: card.image }} style={styles.image} />
                        <Text style={styles.text}>{card.name}</Text>
                        <Text style={styles.text}>{card.address}</Text>
                    </Animated.View>
                );
            })
            .reverse();
    };

    React.useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            let region = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });

            if (region.length > 0) {
                const place = region[0];
                // Example fields: name, city, region, country
                setGeneralArea(`${place.country},${place.region}, ${place.street}`);
            }
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            const radius = 1500;


            const res = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`
            );
            const data = await res.json();

            // Map Google API results to your card format
            const placesWithFullAddress = data.results.map((place, index) => {
                return {
                    id: String(index),
                    name: place.name,
                    image: place.photos
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
                        : 'https://via.placeholder.com/400x300.png?text=No+Image',
                    address: place.vicinity || 'No address',
                };
            });

            setCards(placesWithFullAddress);
            setLoading(false);

        })();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading nearby restaurants...</Text>
            </View>
        )
    } else {
        return (
            <View style={styles.container}>
                {location && (
                    <Text style={{ position: 'absolute', top: 50 }}>
                        📍 You're in: {generalArea}
                    </Text>
                )}
                {renderCards()}

                <View style={{ position: 'absolute', bottom: 40 }}>
                    <Button title="View Liked Places" onPress={() => navigation.navigate('Liked')} />
                </View>
            </View>


        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH * 0.9,
        height: 550,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: 300,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 16,
    },
});

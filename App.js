import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SwipeScreen from './SwipeScreen';
import LikedScreen from './LikedScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={SwipeScreen} />
        <Stack.Screen name="Liked" component={LikedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
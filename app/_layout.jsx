import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6B3F1D',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'Nostalgia',
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="map" 
        options={{ 
          title: 'Memory Map',
          headerBackTitle: 'Home',
        }} 
      />
      <Stack.Screen 
        name="album" 
        options={{ 
          title: 'Photo Album',
          headerBackTitle: 'Home',
        }} 
      />
      <Stack.Screen 
        name="friends" 
        options={{ 
          title: 'Friends',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
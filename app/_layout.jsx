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
          fontSize: 18,
        },
        headerBackTitle: 'Back',
        headerShadowVisible: false,
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
          headerTitleStyle: { fontSize: 22, fontWeight: 'bold' },
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
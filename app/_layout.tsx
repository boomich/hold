import { Stack } from 'expo-router';
import { AppProviders } from '../src/AppProviders';
import { colors } from '../src/design/tokens';
import '../global.css';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: 'AvenirNext-DemiBold' },
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Start' }} />
        <Stack.Screen name="checkin" options={{ title: 'Check-in' }} />
        <Stack.Screen name="logs" options={{ title: 'Logs' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}

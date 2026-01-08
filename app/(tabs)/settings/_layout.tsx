import { Stack } from 'expo-router';
import { colors } from '@/design/tokens';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'Lexend_500Medium' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="logs" options={{ title: 'Logs' }} />
    </Stack>
  );
}

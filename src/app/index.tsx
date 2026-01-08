import { Redirect } from 'expo-router';
import { useAppState } from '@/providers/AppProvider';

export default function Index() {
  const { isReady, plan } = useAppState();

  if (!isReady) {
    return null;
  }

  if (!plan) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

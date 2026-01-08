import { Redirect } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { AppText } from '../src/components/AppText';
import { usePlan } from '../src/features/plan/PlanProvider';

export default function Index() {
  const { plan, loading } = usePlan();

  if (loading) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Loading your plan...
        </AppText>
      </Screen>
    );
  }

  if (!plan) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

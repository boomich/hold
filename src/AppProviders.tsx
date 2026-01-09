import { PropsWithChildren, useEffect, useState } from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Screen } from './components/Screen';
import { AppText } from './components/AppText';
import { initializeDatabase } from './storage/database';
import { PlanProvider } from './features/plan/PlanProvider';
import { initializeNotificationHandler } from './features/notifications/notificationsService';

export function AppProviders({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        // Initialize notification handler after database is ready
        initializeNotificationHandler();
        setReady(true);
      })
      .catch((error) => {
        console.error('Failed to initialize app', error);
        // Still set ready to allow app to continue, but log the error
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <Screen>
          <AppText variant="subtitle" className="mt-10">
            Setting up Hold...
          </AppText>
        </Screen>
      </SafeAreaProvider>
    );
  }

  return <PlanProvider>{children}</PlanProvider>;
}

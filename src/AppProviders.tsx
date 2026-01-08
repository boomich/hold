import { PropsWithChildren, useEffect, useState } from 'react';
import { initializeDatabase } from './storage/database';
import { PlanProvider } from './features/plan/PlanProvider';
import { Screen } from './components/Screen';
import { AppText } from './components/AppText';

export function AppProviders({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Setting up Hold...
        </AppText>
      </Screen>
    );
  }

  return <PlanProvider>{children}</PlanProvider>;
}

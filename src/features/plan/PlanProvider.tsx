import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { Plan } from './domain/types';
import { getPlan } from './storage/planRepository';
import { logError } from '../logs/logService';

type PlanState = {
  plan: Plan | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PlanContext = createContext<PlanState | null>(null);

export function PlanProvider({ children }: PropsWithChildren) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlan();
      setPlan(data);
    } catch (error) {
      await logError('Failed to load plan', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <PlanContext.Provider value={{ plan, loading, refresh: load }}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}

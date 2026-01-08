import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useEffect } from 'react';
import { initializeDatabase } from '@/storage/database';
import {
  createPlan as createPlanService,
  getDayIndex,
  getExistingPlan,
  updatePlanWithRules,
  PlanInput,
} from '@/features/plan/domain/planService';
import { Plan } from '@/features/plan/domain/types';
import { logError, logInfo } from '@/features/logs/domain/logService';

export type PlanUpdate = Partial<Pick<Plan, 'startDate' | 'nizoralDaysOfWeek' | 'eveningTime' | 'morningTime' | 'terbinafineEnabled'>>;

type AppState = {
  isReady: boolean;
  plan: Plan | null;
  dayIndex: number | null;
  createPlan: (input: PlanInput) => Promise<void>;
  updatePlan: (updates: PlanUpdate) => Promise<void>;
  refreshPlan: () => Promise<void>;
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setReady] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const refreshPlan = useCallback(async () => {
    try {
      const current = await getExistingPlan();
      setPlan(current);
    } catch (error) {
      await logError(`Failed to load plan: ${String(error)}`);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initializeDatabase();
        await refreshPlan();
        await logInfo('Database initialized');
      } catch (error) {
        await logError(`Initialization error: ${String(error)}`);
      } finally {
        setReady(true);
      }
    };
    bootstrap();
  }, [refreshPlan]);

  const createPlan = useCallback(
    async (input: PlanInput) => {
      const created = await createPlanService(input);
      setPlan(created);
    },
    []
  );

  const updatePlan = useCallback(
    async (updates: PlanUpdate) => {
      const updated = await updatePlanWithRules(updates, new Date());
      setPlan(updated);
    },
    []
  );

  const dayIndex = useMemo(() => {
    if (!plan) {
      return null;
    }
    return getDayIndex(plan.startDate, new Date());
  }, [plan]);

  const value = useMemo(
    () => ({ isReady, plan, dayIndex, createPlan, updatePlan, refreshPlan }),
    [isReady, plan, dayIndex, createPlan, updatePlan, refreshPlan]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
};

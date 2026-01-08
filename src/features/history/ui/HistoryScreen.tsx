import { useEffect, useState } from 'react';
import { FlatList, View } from 'uniwind/components';
import { format, parseISO } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/shared/ui/Screen';
import { Card } from '@/shared/ui/Card';
import { Text } from '@/shared/ui/Text';
import { colors } from '@/design/tokens';
import { fetchHistory, HistoryDay } from '@/features/history/domain/historyService';
import { TaskType } from '@/features/plan/domain/types';

const taskIcons: Record<TaskType, string> = {
  NIZORAL_WASH: 'shower',
  NIZORAL_LATHER: 'hand-wash',
  TERBINAFINE: 'leaf',
};

export const HistoryScreen = () => {
  const [history, setHistory] = useState<HistoryDay[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchHistory();
      setHistory(data);
    };
    load();
  }, []);

  return (
    <Screen>
      <View className="gap-4 pt-6">
        <Text variant="title">History</Text>
        <FlatList
          data={history}
          keyExtractor={(item) => item.date}
          scrollEnabled={false}
          contentContainerClassName="gap-3 pb-10"
          renderItem={({ item }) => (
            <Card className="flex-row items-center justify-between">
              <View>
                <Text variant="h3">{format(parseISO(item.date), 'EEE, MMM d')}</Text>
                <Text variant="small" className="text-muted">
                  {item.completions.length ? 'Tasks completed' : 'No tasks logged'}
                </Text>
              </View>
              <View className="flex-row gap-2 items-center">
                {item.completions.map((task) => (
                  <MaterialCommunityIcons
                    key={`${item.date}-${task}`}
                    name={taskIcons[task] as any}
                    size={20}
                    color={colors.accent}
                  />
                ))}
                {item.hasCheckIn && (
                  <MaterialCommunityIcons name="text-box-check" size={20} color={colors.warn} />
                )}
              </View>
            </Card>
          )}
        />
      </View>
    </Screen>
  );
};

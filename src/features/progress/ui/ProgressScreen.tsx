import { useEffect, useState } from 'react';
import { View } from 'uniwind/components';
import Svg, { Polyline } from 'react-native-svg';
import { Screen } from '@/shared/ui/Screen';
import { Card } from '@/shared/ui/Card';
import { Text } from '@/shared/ui/Text';
import { colors } from '@/design/tokens';
import { useAppState } from '@/providers/AppProvider';
import { fetchProgress, ProgressPoint } from '@/features/progress/domain/progressService';

const buildPoints = (data: ProgressPoint[], key: 'itchScore' | 'flakesScore', maxValue: number) => {
  if (!data.length) {
    return '';
  }
  const width = 240;
  const height = 80;
  return data
    .map((point, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const value = point[key] ?? 0;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    })
    .join(' ');
};

export const ProgressScreen = () => {
  const { plan, dayIndex } = useAppState();
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!plan || !dayIndex || dayIndex < 21) {
        return;
      }
      const result = await fetchProgress(plan);
      setPoints(result.points);
      setCompletionRate(result.completionRate);
    };
    load();
  }, [plan, dayIndex]);

  if (!plan || !dayIndex) {
    return (
      <Screen>
        <View className="pt-8">
          <Text variant="body">Loading progress...</Text>
        </View>
      </Screen>
    );
  }

  if (dayIndex < 21) {
    return (
      <Screen>
        <View className="gap-6 pt-6">
          <Text variant="title">Progress is locked</Text>
          <Card className="gap-2">
            <Text variant="h3">No analysis until day 21</Text>
            <Text variant="small">
              Keep showing up. We’ll review trends once the habit is steady.
            </Text>
          </Card>
        </View>
      </Screen>
    );
  }

  const itchLine = buildPoints(points, 'itchScore', 10);
  const flakesLine = buildPoints(points, 'flakesScore', 5);

  return (
    <Screen>
      <View className="gap-6 pt-6">
        <View className="gap-1">
          <Text variant="title">Progress</Text>
          <Text variant="small">Last 30 days at a glance.</Text>
        </View>

        <Card className="gap-3">
          <Text variant="h3">Completion rate</Text>
          <Text variant="body">{completionRate}% of planned tasks done</Text>
        </Card>

        <Card className="gap-4">
          <Text variant="h3">Itch trend</Text>
          {points.length ? (
            <Svg width={240} height={80}>
              <Polyline
                points={itchLine}
                fill="none"
                stroke={colors.accent}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Svg>
          ) : (
            <Text variant="small">No check-ins yet.</Text>
          )}
        </Card>

        <Card className="gap-4">
          <Text variant="h3">Flakes trend</Text>
          {points.length ? (
            <Svg width={240} height={80}>
              <Polyline
                points={flakesLine}
                fill="none"
                stroke={colors.warn}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Svg>
          ) : (
            <Text variant="small">No check-ins yet.</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
};

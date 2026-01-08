import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { colors } from '@/design/tokens';
import { fetchCheckIn, saveCheckIn } from '@/features/checkin/domain/checkinService';
import { logError } from '@/features/logs/domain/logService';

export const CheckInScreen = () => {
  const router = useRouter();
  const [itchScore, setItchScore] = useState(0);
  const [flakesScore, setFlakesScore] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    const load = async () => {
      const existing = await fetchCheckIn(new Date());
      if (existing) {
        setItchScore(existing.itchScore ?? 0);
        setFlakesScore(existing.flakesScore ?? 0);
        setNote(existing.freeText ?? '');
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      await saveCheckIn(new Date(), itchScore, flakesScore, note.trim() || null);
      router.back();
    } catch (error) {
      await logError(`Failed to save check-in: ${String(error)}`);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-6">
        <View className="gap-1">
          <Text variant="title">10-second check-in</Text>
          <Text variant="small">Quick, honest, and done.</Text>
        </View>

        <Card className="gap-4">
          <View className="gap-2">
            <Text variant="h3">Itch</Text>
            <Text variant="small">{itchScore}/10</Text>
            <Slider
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={itchScore}
              onValueChange={setItchScore}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.line}
              thumbTintColor={colors.accent}
            />
          </View>

          <View className="gap-2">
            <Text variant="h3">Flakes</Text>
            <Text variant="small">{flakesScore}/5</Text>
            <Slider
              minimumValue={0}
              maximumValue={5}
              step={1}
              value={flakesScore}
              onValueChange={setFlakesScore}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.line}
              thumbTintColor={colors.accent}
            />
          </View>

          <View className="gap-2">
            <Text variant="h3">Optional note</Text>
            <TextInput
              className="border border-line rounded-card p-3 text-body font-body text-ink"
              placeholder="Anything to remember?"
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>
        </Card>

        <Button label="Save check-in" onPress={handleSave} />
      </View>
    </Screen>
  );
};

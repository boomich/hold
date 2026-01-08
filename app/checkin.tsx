import { useEffect, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { AppText } from '../src/components/AppText';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { formatDateISO } from '../src/utils/date';
import { getCheckInByDate, upsertCheckIn } from '../src/features/checkin/storage/checkinRepository';
import { logError } from '../src/features/logs/logService';
import { colors } from '../src/design/tokens';

export default function CheckIn() {
  const todayISO = formatDateISO(new Date());
  const [itch, setItch] = useState(5);
  const [flakes, setFlakes] = useState(2);
  const [note, setNote] = useState('');

  useEffect(() => {
    getCheckInByDate(todayISO)
      .then((data) => {
        if (!data) {
          return;
        }
        if (typeof data.itchScore === 'number') {
          setItch(data.itchScore);
        }
        if (typeof data.flakesScore === 'number') {
          setFlakes(data.flakesScore);
        }
        if (data.freeText) {
          setNote(data.freeText);
        }
      })
      .catch((error) => logError('Failed to load check-in', error));
  }, [todayISO]);

  const handleSave = async () => {
    try {
      await upsertCheckIn({
        date: todayISO,
        itchScore: itch,
        flakesScore: flakes,
        freeText: note.trim() ? note.trim() : null,
      });
      router.back();
    } catch (error) {
      await logError('Failed to save check-in', error);
    }
  };

  return (
    <Screen>
      <View className="flex-1 pb-6">
        <AppText variant="title" className="mt-6">
          Quick check-in
        </AppText>
        <AppText variant="muted" className="mt-1">
          Two taps and you are done.
        </AppText>

        <View className="mt-6">
          <Card>
            <AppText variant="subtitle">Itch (0-10)</AppText>
            <AppText variant="muted" className="mt-1">
              {itch}
            </AppText>
            <Slider
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={itch}
              onValueChange={setItch}
              minimumTrackTintColor={colors.moss}
              maximumTrackTintColor={colors.clay}
              thumbTintColor={colors.mossDark}
            />
          </Card>
        </View>

        <View className="mt-4">
          <Card>
            <AppText variant="subtitle">Flakes (0-5)</AppText>
            <AppText variant="muted" className="mt-1">
              {flakes}
            </AppText>
            <Slider
              minimumValue={0}
              maximumValue={5}
              step={1}
              value={flakes}
              onValueChange={setFlakes}
              minimumTrackTintColor={colors.moss}
              maximumTrackTintColor={colors.clay}
              thumbTintColor={colors.mossDark}
            />
          </Card>
        </View>

        <View className="mt-4">
          <Card>
            <AppText variant="subtitle">Optional note</AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Anything quick to remember"
              placeholderTextColor={colors.inkMuted}
              className="mt-2 min-h-20 rounded-xl bg-mist px-3 py-2 text-ink"
              style={{ fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'serif' }}
              multiline
            />
          </Card>
        </View>

        <View className="mt-6">
          <Button label="Save" onPress={handleSave} />
        </View>
      </View>
    </Screen>
  );
}

import { Pressable, View } from 'react-native';
import { AppText } from './AppText';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  selectedDays: number[];
  onToggle: (dayIndex: number) => void;
  disabled?: boolean;
};

export function DayOfWeekPicker({ selectedDays, onToggle, disabled }: Props) {
  return (
    <View className={`flex-row flex-wrap ${disabled ? 'opacity-60' : 'opacity-100'}`}>
      {days.map((day, index) => {
        const selected = selectedDays.includes(index);
        return (
          <Pressable
            key={day}
            onPress={() => onToggle(index)}
            disabled={disabled}
            className={`mb-2 mr-2 rounded-full px-4 py-2 ${selected ? 'bg-moss' : 'bg-sand'}`}
          >
            <AppText variant="caption" className={selected ? 'text-surface' : 'text-ink'}>
              {day}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

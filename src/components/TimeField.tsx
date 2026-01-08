import { Pressable, View } from 'react-native';
import { AppText } from './AppText';

type Props = {
  label: string;
  value: string;
  onPress: () => void;
  description?: string;
  disabled?: boolean;
};

export function TimeField({ label, value, onPress, description, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-xl bg-surface px-4 py-3 ${disabled ? 'opacity-60' : 'opacity-100'}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <AppText>{label}</AppText>
          {description ? (
            <AppText variant="muted" className="mt-1">
              {description}
            </AppText>
          ) : null}
        </View>
        <AppText variant="subtitle" className="text-mossDark">
          {value}
        </AppText>
      </View>
    </Pressable>
  );
}

import { Switch, View } from 'react-native';
import { AppText } from './AppText';

type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
};

export function ToggleRow({ label, value, onChange, description, disabled }: Props) {
  return (
    <View className={`flex-row items-center justify-between rounded-xl bg-surface px-4 py-3 ${
      disabled ? 'opacity-60' : 'opacity-100'
    }`}>
      <View className="flex-1 pr-4">
        <AppText>{label}</AppText>
        {description ? (
          <AppText variant="muted" className="mt-1">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

import { Pressable, View } from 'react-native';
import { AppText } from './AppText';

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function Banner({ message, actionLabel, onAction }: Props) {
  return (
    <View className="rounded-xl border border-border bg-sand px-4 py-3">
      <AppText>{message}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="mt-2">
          <AppText variant="subtitle" className="text-mossDark">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

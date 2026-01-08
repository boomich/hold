import { View } from 'react-native';
import { AppText } from './AppText';

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <View className="mb-3">
      <AppText variant="subtitle">{title}</AppText>
      {subtitle ? <AppText variant="muted" className="mt-1">
        {subtitle}
      </AppText> : null}
    </View>
  );
}

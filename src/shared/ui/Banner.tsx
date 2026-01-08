import { View } from 'uniwind/components';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';

export const Banner = ({
  title,
  body,
  actionLabel,
  onPress,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onPress: () => void;
}) => {
  return (
    <View className="bg-accentSoft border border-line rounded-card p-card gap-2">
      <Text variant="h3">{title}</Text>
      <Text variant="small" className="text-muted">
        {body}
      </Text>
      <Button label={actionLabel} variant="secondary" size="sm" onPress={onPress} />
    </View>
  );
};

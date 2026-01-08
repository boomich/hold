import { PressableProps } from 'react-native';
import { Pressable } from 'uniwind/components';
import { Text } from '@/shared/ui/Text';

export const Chip = ({
  label,
  selected,
  ...props
}: PressableProps & { label: string; selected?: boolean }) => {
  return (
    <Pressable
      className={`px-3 py-2 rounded-pill border ${
        selected ? 'bg-accentSoft border-accent' : 'bg-surface border-line'
      }`}
      {...props}
    >
      <Text variant="small" className={selected ? 'text-ink' : 'text-muted'}>
        {label}
      </Text>
    </Pressable>
  );
};

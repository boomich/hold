import { Pressable, PressableProps } from 'react-native';
import { AppText } from './AppText';

type Props = PressableProps & {
  label: string;
};

export function SmallButton({ label, ...props }: Props) {
  return (
    <Pressable {...props} className="rounded-full bg-sand px-4 py-2">
      <AppText variant="caption" className="text-ink">
        {label}
      </AppText>
    </Pressable>
  );
}

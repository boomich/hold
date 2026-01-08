import { Pressable, PressableProps, View } from 'react-native';
import { AppText } from './AppText';

const variants = {
  primary: 'bg-moss text-surface',
  secondary: 'bg-sand text-ink',
  outline: 'border border-border bg-surface text-ink',
  ghost: 'bg-transparent text-ink',
};

type Variant = keyof typeof variants;

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  disabled?: boolean;
};

export function Button({ label, variant = 'primary', disabled, ...props }: Props) {
  const tone = variants[variant];
  const disabledStyle = disabled ? 'opacity-50' : 'opacity-100';

  return (
    <Pressable {...props} disabled={disabled} className={`rounded-xl px-5 py-4 ${disabledStyle} ${tone}`}>
      <View className="items-center">
        <AppText variant="subtitle" className={variant === 'primary' ? 'text-surface' : 'text-ink'}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

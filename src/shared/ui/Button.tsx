import { Pressable, PressableProps } from 'react-native';
import { Text } from '@/shared/ui/Text';

const variants = {
  primary: 'bg-accent border border-accent',
  secondary: 'bg-accentSoft border border-line',
  ghost: 'bg-transparent border border-line',
};

const sizes = {
  md: 'py-3 px-4',
  sm: 'py-2 px-3',
};

type ButtonProps = PressableProps & {
  label: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = ({ label, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  return (
    <Pressable
      className={`rounded-pill items-center justify-center ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      <Text
        variant="body"
        className={variant === 'primary' ? 'text-surface' : 'text-ink'}
      >
        {label}
      </Text>
    </Pressable>
  );
};

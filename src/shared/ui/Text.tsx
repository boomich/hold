import { TextProps } from 'react-native';
import { Text as RNText } from 'uniwind/components';

const variants = {
  title: 'font-display text-title text-ink',
  h2: 'font-display text-h2 text-ink',
  h3: 'font-medium text-h3 text-ink',
  body: 'font-body text-body text-ink',
  small: 'font-body text-small text-muted',
};

export type TextVariant = keyof typeof variants;

type Props = TextProps & {
  variant?: TextVariant;
  className?: string;
};

export const Text = ({ variant = 'body', className, ...props }: Props) => {
  return <RNText className={`${variants[variant]} ${className ?? ''}`.trim()} {...props} />;
};

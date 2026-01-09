import { Platform, Text, TextProps } from 'react-native';
import { fontSize } from '../design/tokens';

const variants = {
  title: {
    className: 'text-ink',
    fontSize: fontSize.title,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'serif' }),
  },
  subtitle: {
    className: 'text-ink',
    fontSize: fontSize.subtitle,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'serif' }),
  },
  body: {
    className: 'text-ink',
    fontSize: fontSize.body,
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'serif' }),
  },
  muted: {
    className: 'text-inkMuted',
    fontSize: fontSize.muted,
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'serif' }),
  },
  caption: {
    className: 'text-inkMuted',
    fontSize: fontSize.caption,
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'serif' }),
  },
};

type Variant = keyof typeof variants;

type Props = TextProps & {
  variant?: Variant;
};

export function AppText({ variant = 'body', className = '', style, ...props }: Props) {
  const variantStyle = variants[variant];
  return (
    <Text
      {...props}
      className={`${variantStyle.className} ${className}`}
      style={[{ fontFamily: variantStyle.fontFamily, fontSize: variantStyle.fontSize }, style]}
    />
  );
}

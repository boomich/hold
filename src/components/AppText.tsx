import { Platform, Text, TextProps } from 'react-native';

const variants = {
  title: { className: 'text-2xl text-ink', fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'serif' }) },
  subtitle: { className: 'text-lg text-ink', fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'serif' }) },
  body: { className: 'text-base text-ink', fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'serif' }) },
  muted: { className: 'text-sm text-inkMuted', fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'serif' }) },
  caption: { className: 'text-xs text-inkMuted', fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'serif' }) },
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
      style={[{ fontFamily: variantStyle.fontFamily }, style]}
    />
  );
}

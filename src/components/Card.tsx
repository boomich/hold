import { View, ViewProps } from 'react-native';

export function Card({ className = '', ...props }: ViewProps) {
  return <View {...props} className={`rounded-2xl bg-surface px-5 py-4 ${className}`} />;
}

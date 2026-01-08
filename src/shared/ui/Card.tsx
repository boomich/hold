import { View, ViewProps } from 'react-native';

export const Card = ({ className, ...props }: ViewProps & { className?: string }) => {
  return (
    <View
      className={`bg-card border border-line rounded-card p-card ${className ?? ''}`.trim()}
      {...props}
    />
  );
};

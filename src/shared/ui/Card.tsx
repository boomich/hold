import { ViewProps } from 'react-native';
import { View } from 'uniwind/components';

export const Card = ({ className, ...props }: ViewProps & { className?: string }) => {
  return (
    <View
      className={`bg-card border border-line rounded-card p-card ${className ?? ''}`.trim()}
      {...props}
    />
  );
};

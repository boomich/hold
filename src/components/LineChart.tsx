import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { colors } from '../design/tokens';

type Props = {
  data: number[];
  height?: number;
  stroke?: string;
};

export function LineChart({ data, height = 120, stroke = colors.mossDark }: Props) {
  if (data.length < 2) {
    return <View className="h-24 rounded-xl bg-sand" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 300;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View className="rounded-xl bg-sand px-2 py-2">
      <Svg width="100%" height={height} viewBox="0 0 300 120">
        <Polyline points={points} fill="none" stroke={stroke} strokeWidth={3} />
      </Svg>
    </View>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../design/tokens';

export function Screen({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={[colors.surface, colors.mist]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 px-5" edges={['top', 'left', 'right']}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

import { PropsWithChildren } from 'react';

import { View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../design/tokens';

export function Screen({
  children,
  scrollable = false,
}: PropsWithChildren & { scrollable?: boolean }) {
  return (
    <LinearGradient colors={[colors.surface, colors.mist]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['left', 'right']}>
        {scrollable && <ScrollView className="px-5">{children}</ScrollView>}
        {!scrollable && <View className="flex-1 px-5">{children}</View>}
      </SafeAreaView>
    </LinearGradient>
  );
}

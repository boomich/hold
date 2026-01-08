import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { colors } from '@/design/tokens';

export const Screen = ({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) => {
  const content = scroll ? (
    <ScrollView
      contentContainerClassName="px-screen pb-10"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="px-screen flex-1">{children}</View>
  );

  return (
    <LinearGradient
      colors={[colors.bg, colors.haze]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">{content}</SafeAreaView>
    </LinearGradient>
  );
};

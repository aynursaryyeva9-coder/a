import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function GradientHeader({ title, subtitle, style }: GradientHeaderProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  React.useEffect(() => {
    opacity.value = withSpring(1);
    translateY.value = withSpring(0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={animatedStyle}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A237E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#5C6BC0',
    marginTop: 4,
  },
});

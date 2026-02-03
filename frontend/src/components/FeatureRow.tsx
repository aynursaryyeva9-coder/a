import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft } from 'react-native-reanimated';

interface FeatureRowProps {
  text: string;
  index?: number;
}

export function FeatureRow({ text, index = 0 }: FeatureRowProps) {
  return (
    <Animated.View
      entering={FadeInLeft.delay(100 * index).springify()}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={22} color="#1E88E5" />
      </View>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    marginRight: 14,
  },
  text: {
    fontSize: 16,
    color: '#37474F',
    flex: 1,
    fontWeight: '500',
  },
});

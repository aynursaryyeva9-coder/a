import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.2);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15 });
      shadowOpacity.value = withSpring(0.1);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    shadowOpacity.value = withSpring(0.2);
  };

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.button,
          getButtonStyle(),
          (disabled || loading) && styles.disabledButton,
          style,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? '#1E88E5' : '#fff'} />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={variant === 'outline' ? '#1E88E5' : '#fff'}
                style={styles.icon}
              />
            )}
            <Text style={[getTextStyle(), (disabled || loading) && styles.disabledText]}>
              {title}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
  },
  secondaryButton: {
    backgroundColor: '#43A047',
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1E88E5',
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  outlineText: {
    color: '#1E88E5',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledText: {
    color: '#fff',
  },
  icon: {
    marginRight: 8,
  },
});

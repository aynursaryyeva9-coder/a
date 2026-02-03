import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Giriş başarısız';
      Alert.alert('Hata', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Branding */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Ionicons name="medical" size={48} color="#1E88E5" />
              </View>
              <View style={styles.logoPulse} />
            </View>
            <Text style={styles.title}>VitaMed</Text>
            <Text style={styles.subtitle}>Sağlığınız Güvende</Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Telefon Numarası</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="call" size={20} color="#1E88E5" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor="#B0BEC5"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed" size={20} color="#1E88E5" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••"
                  placeholderTextColor="#B0BEC5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#78909C"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <AnimatedTouchable
              style={[styles.loginButton, buttonAnimatedStyle, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              onPressIn={() => { buttonScale.value = withSpring(0.96); }}
              onPressOut={() => { buttonScale.value = withSpring(1); }}
              disabled={isLoading}
              activeOpacity={1}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                  <View style={styles.buttonIcon}>
                    <Ionicons name="arrow-forward" size={20} color="#1E88E5" />
                  </View>
                </>
              )}
            </AnimatedTouchable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Ionicons name="person-add" size={20} color="#1E88E5" />
              <Text style={styles.registerButtonText}>Yeni Hesap Oluştur</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={18} color="#43A047" />
                <Text style={styles.featureText}>Güvenli</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="lock-closed" size={18} color="#1E88E5" />
                <Text style={styles.featureText}>Şifreli</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cloud" size={18} color="#7E57C2" />
                <Text style={styles.featureText}>Bulut</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoInner: {
    width: 100,
    height: 100,
    backgroundColor: '#E3F2FD',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#1E88E5',
    borderRadius: 36,
    opacity: 0.1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A237E',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#5C6BC0',
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8EEF4',
    overflow: 'hidden',
  },
  inputIconContainer: {
    width: 52,
    height: 56,
    backgroundColor: '#F5F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E8EEF4',
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#263238',
    paddingHorizontal: 16,
  },
  eyeButton: {
    width: 52,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    borderRadius: 16,
    height: 58,
    marginTop: 12,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
    shadowOpacity: 0.15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#90A4AE',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 58,
    borderWidth: 2,
    borderColor: '#1E88E5',
  },
  registerButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  footer: {
    marginTop: 40,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#78909C',
    fontWeight: '500',
  },
});

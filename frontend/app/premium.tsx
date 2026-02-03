import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { FeatureRow } from '../src/components/FeatureRow';
import { PrimaryButton } from '../src/components/PrimaryButton';

export default function PremiumScreen() {
  const router = useRouter();
  const crownScale = useSharedValue(1);

  React.useEffect(() => {
    crownScale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 10 })
      ),
      -1,
      true
    );
  }, []);

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const handleSubscribe = (plan: string) => {
    Alert.alert(
      'Abonelik',
      `${plan} planını seçtiniz. Gerçek ödeme entegrasyonu yakında eklenecek.`,
      [{ text: 'Tamam' }]
    );
  };

  const features = [
    'Detaylı sağlık takibi',
    'Yapay zekâ destekli analizler',
    'Sınırsız kayıt ve geçmiş',
    'Reklamsız kullanım',
    'Öncelikli destek',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#37474F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Crown Icon */}
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.crownContainer, crownAnimatedStyle]}
        >
          <Ionicons name="diamond" size={48} color="#FFC107" />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.titleContainer}>
          <Text style={styles.title}>Premium'a Geç</Text>
          <Text style={styles.subtitle}>
            Daha detaylı takip ve gelişmiş özelliklere eriş
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <FeatureRow key={index} text={feature} index={index} />
          ))}
        </Animated.View>

        {/* Pricing Cards */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.pricingContainer}>
          {/* Trial Info */}
          <View style={styles.trialBadge}>
            <Ionicons name="gift" size={16} color="#43A047" />
            <Text style={styles.trialBadgeText}>7 gün ücretsiz deneme</Text>
          </View>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handleSubscribe('Aylık')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Aylık</Text>
            </View>
            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>99₺</Text>
              <Text style={styles.planPeriod}>/ay</Text>
            </View>
          </TouchableOpacity>

          {/* Yearly Plan */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardPopular]}
            onPress={() => handleSubscribe('Yıllık')}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>En Popüler</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, styles.planNamePopular]}>Yıllık</Text>
            </View>
            <View style={styles.planPricing}>
              <Text style={[styles.planPrice, styles.planPricePopular]}>699₺</Text>
              <Text style={[styles.planPeriod, styles.planPeriodPopular]}>/yıl</Text>
            </View>
            <View style={styles.savingBadge}>
              <Text style={styles.savingText}>%42 tasarruf</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.ctaContainer}>
          <PrimaryButton
            title="Ücretsiz denemeyi başlat"
            onPress={() => handleSubscribe('7 Günlük Deneme')}
            icon="rocket"
          />
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            İstediğin zaman iptal edebilirsin. Deneme süresinde ücret alınmaz.
          </Text>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={14} color="#78909C" />
            <Text style={styles.securityText}>Güvenli ödeme</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  crownContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#FFF8E1',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pricingContainer: {
    marginBottom: 24,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  trialBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#43A047',
    marginLeft: 6,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8EEF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardPopular: {
    borderColor: '#1E88E5',
    backgroundColor: '#E3F2FD',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#1E88E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
  },
  planNamePopular: {
    color: '#1565C0',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A237E',
  },
  planPricePopular: {
    color: '#1565C0',
  },
  planPeriod: {
    fontSize: 16,
    color: '#78909C',
    marginLeft: 4,
  },
  planPeriodPopular: {
    color: '#1565C0',
  },
  savingBadge: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  savingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  ctaContainer: {
    marginBottom: 20,
  },
  disclaimerContainer: {
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 13,
    color: '#90A4AE',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#78909C',
    marginLeft: 4,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface PrivacyPolicyViewProps {
  isVisible: boolean;
  onAccept: () => void;
}

const { height } = Dimensions.get('window');

export function PrivacyPolicyView({ isVisible, onAccept }: PrivacyPolicyViewProps) {
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleAccept = () => {
    onAccept();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {}} // Boş bırak - kapatılamaz
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={32} color="#1E88E5" />
          </View>
          <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        </Animated.View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Text style={styles.sectionTitle}>Gizlilik Politikası</Text>
            
            <Text style={styles.paragraph}>
              Bu uygulama kullanıcı gizliliğine önem verir.
            </Text>

            <Text style={styles.sectionSubtitle}>Toplanan veriler:</Text>
            <View style={styles.bulletList}>
              <BulletPoint text="Telefon numarası" />
              <BulletPoint text="Kullanıcının manuel olarak girdiği bilgiler" />
              <BulletPoint text="Yüklenen sağlık belgeleri" />
            </View>

            <Text style={styles.sectionSubtitle}>Veriler:</Text>
            <View style={styles.bulletList}>
              <BulletPoint text="Sadece uygulama hizmetlerini sunmak için kullanılır" />
              <BulletPoint text="Üçüncü kişilerle paylaşılmaz" />
              <BulletPoint text="Güvenli sunucularda şifreli olarak saklanır" />
            </View>

            <Text style={styles.sectionSubtitle}>AI Asistan:</Text>
            <View style={styles.bulletList}>
              <BulletPoint text="Sohbetleriniz gizli tutulur" />
              <BulletPoint text="Asistan genel bilgi verir, tanı koymaz" />
            </View>

            {/* Warning Card */}
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={24} color="#F57C00" />
              <Text style={styles.warningText}>
                Bu uygulama tıbbi tavsiye vermez ve doktor yerine geçmez. Sağlık sorunlarınız için mutlaka bir sağlık uzmanına başvurunuz.
              </Text>
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                "Kabul Et" butonuna basarak gizlilik politikasını ve kullanım koşullarını kabul etmiş olursunuz.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Accept Button */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            onPressIn={() => { buttonScale.value = withSpring(0.96); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            activeOpacity={1}
          >
            <Animated.View style={[styles.acceptButtonInner, buttonAnimatedStyle]}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.acceptButtonText}>Kabul Et</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletItem}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF4',
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A237E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#546E7A',
    lineHeight: 24,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    backgroundColor: '#1E88E5',
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#546E7A',
    lineHeight: 22,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    marginLeft: 12,
  },
  termsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#ECEFF1',
    borderRadius: 12,
  },
  termsText: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
  },
  acceptButton: {
    overflow: 'hidden',
    borderRadius: 14,
  },
  acceptButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    height: 56,
    borderRadius: 14,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { InfoCard } from '../../src/components/InfoCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  created_at: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentDocs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get(`/documents?token=${token}`);
      setRecentDocs(response.data.slice(0, 3));
    } catch (error) {
      console.log('Error fetching documents:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchRecentDocs();
  }, [fetchRecentDocs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecentDocs();
    setRefreshing(false);
  }, [fetchRecentDocs]);

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      blood_test: 'Kan Tahlili',
      xray: 'Röntgen',
      prescription: 'Reçete',
      other: 'Diğer',
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      blood_test: 'water',
      xray: 'scan',
      prescription: 'receipt',
      other: 'document',
    };
    return icons[type] || 'document';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      blood_test: '#E53935',
      xray: '#8E24AA',
      prescription: '#43A047',
      other: '#1E88E5',
    };
    return colors[type] || '#1E88E5';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getLastRecordDate = () => {
    if (recentDocs.length === 0) return 'Kayıt yok';
    const lastDoc = recentDocs[0];
    const date = new Date(lastDoc.date);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    return `${diffDays} gün önce`;
  };

  const QuickActionCard = ({ 
    icon, 
    title, 
    color, 
    bgColor, 
    onPress, 
    index 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    title: string; 
    color: string; 
    bgColor: string; 
    onPress: () => void;
    index: number;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedTouchable
        entering={FadeInDown.delay(100 * index).springify()}
        style={[styles.actionCard, animatedStyle]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
      >
        <View style={[styles.actionIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.actionText}>{title}</Text>
      </AnimatedTouchable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
        }
      >
        {/* Header - SwiftUI Style */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hoş geldin</Text>
            <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-circle" size={44} color="#1E88E5" />
          </TouchableOpacity>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text 
          entering={FadeInDown.delay(50).springify()} 
          style={styles.subtitle}
        >
          Sağlığını güvenle takip et
        </Animated.Text>

        {/* Info Cards - SwiftUI Style */}
        <View style={styles.cardsContainer}>
          <InfoCard 
            title="Günlük Durum" 
            value="İyi" 
            index={0}
          />
          <InfoCard 
            title="Son Kayıt" 
            value={getLastRecordDate()} 
            index={1}
          />
          <InfoCard 
            title="Toplam Belge" 
            value={`${recentDocs.length} Adet`} 
            index={2}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="cloud-upload"
              title="Belge Yükle"
              color="#1E88E5"
              bgColor="#E3F2FD"
              onPress={() => router.push('/(tabs)/upload')}
              index={0}
            />
            <QuickActionCard
              icon="folder-open"
              title="Belgelerim"
              color="#43A047"
              bgColor="#E8F5E9"
              onPress={() => router.push('/(tabs)/documents')}
              index={1}
            />
            <QuickActionCard
              icon="chatbubble-ellipses"
              title="Asistan"
              color="#FB8C00"
              bgColor="#FFF3E0"
              onPress={() => router.push('/(tabs)/assistant')}
              index={2}
            />
          </View>
        </View>

        {/* Premium CTA - SwiftUI Style */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.premiumSection}>
          <PrimaryButton
            title="Premium özellikleri keşfet"
            onPress={() => router.push('/premium')}
            icon="diamond"
          />
        </Animated.View>

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Belgeler</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/documents')}>
                <Text style={styles.seeAll}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>

            {recentDocs.map((doc, index) => (
              <AnimatedTouchable
                key={doc.id}
                entering={SlideInRight.delay(100 * index).springify()}
                style={styles.docCard}
                onPress={() => router.push(`/document/${doc.id}`)}
              >
                <View style={[styles.docIcon, { backgroundColor: `${getTypeColor(doc.type)}15` }]}>
                  <Ionicons name={getTypeIcon(doc.type)} size={24} color={getTypeColor(doc.type)} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>
                    {getTypeLabel(doc.type)} • {formatDate(doc.date)}
                  </Text>
                </View>
                <View style={styles.docArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                </View>
              </AnimatedTouchable>
            ))}
          </View>
        )}

        {/* Health Disclaimer - SwiftUI Style */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            Bu uygulama tıbbi tavsiye vermez ve doktor yerine geçmez.
          </Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A237E',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  profileButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#78909C',
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    color: '#37474F',
    fontWeight: '600',
    textAlign: 'center',
  },
  premiumSection: {
    marginBottom: 28,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  docIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 13,
    color: '#78909C',
  },
  docArrow: {
    width: 32,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerContainer: {
    paddingTop: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#90A4AE',
    textAlign: 'center',
    lineHeight: 18,
  },
});

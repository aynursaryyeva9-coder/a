import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeInDown,
  FadeInRight,
  SlideInRight,
} from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  created_at: string;
}

const { width } = Dimensions.get('window');

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
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
          </View>
          <Animated.View 
            entering={FadeInRight.delay(200).springify()}
            style={styles.logoContainer}
          >
            <Ionicons name="medical" size={32} color="#1E88E5" />
          </Animated.View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsCard}>
          <View style={styles.statsGradient}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{recentDocs.length}</Text>
                <Text style={styles.statLabel}>Toplam Belge</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="shield-checkmark" size={28} color="#fff" />
                <Text style={styles.statLabel}>Güvenli</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="cloud-done" size={28} color="#fff" />
                <Text style={styles.statLabel}>Yedekli</Text>
              </View>
            </View>
          </View>
        </Animated.View>

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

        {/* Recent Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Belgeler</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/documents')}>
              <Text style={styles.seeAll}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {recentDocs.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={48} color="#90CAF9" />
              </View>
              <Text style={styles.emptyTitle}>Henüz belge yok</Text>
              <Text style={styles.emptyText}>Sağlık belgelerinizi yükleyerek başlayın</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => router.push('/(tabs)/upload')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>İlk Belgenizi Yükleyin</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            recentDocs.map((doc, index) => (
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
            ))
          )}
        </View>

        {/* Health Tips */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Sağlık İpucu</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="bulb" size={24} color="#FFC107" />
            </View>
            <Text style={styles.tipText}>
              Düzenli sağlık kontrolü yaptırmak, hastalıkların erken teşhisi için önemlidir.
              Yılda en az bir kez check-up yaptırmayı unutmayın.
            </Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#78909C',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A237E',
    letterSpacing: -0.5,
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCard: {
    borderRadius: 20,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statsGradient: {
    backgroundColor: '#1E88E5',
    padding: 24,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
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
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#E3F2FD',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#78909C',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFDE7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFF9C4',
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF59D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 22,
  },
});

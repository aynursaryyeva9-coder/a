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
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  created_at: string;
}

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Ionicons name="medical" size={32} color="#1E88E5" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/upload')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="cloud-upload" size={28} color="#1E88E5" />
              </View>
              <Text style={styles.actionText}>Belge Yükle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/documents')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="folder" size={28} color="#43A047" />
              </View>
              <Text style={styles.actionText}>Belgelerim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/assistant')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="chatbubbles" size={28} color="#FB8C00" />
              </View>
              <Text style={styles.actionText}>Asistan</Text>
            </TouchableOpacity>
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
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>Henüz belge yok</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => router.push('/(tabs)/upload')}
              >
                <Text style={styles.uploadButtonText}>İlk Belgenizi Yükleyin</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.docCard}
                onPress={() => router.push(`/document/${doc.id}`)}
              >
                <View style={styles.docIcon}>
                  <Ionicons name={getTypeIcon(doc.type)} size={24} color="#1E88E5" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>
                    {getTypeLabel(doc.type)} • {formatDate(doc.date)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Health Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sağlık İpucu</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#FFC107" />
            <Text style={styles.tipText}>
              Düzenli sağlık kontrolü yaptırmak, hastalıkların erken teşhisi için önemlidir.
              Yılda en az bir kez check-up yaptırmayı unutmayın.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#E3F2FD',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 12,
    color: '#999',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
});

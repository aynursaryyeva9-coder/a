import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
  notes?: string;
  file_type: string;
  created_at: string;
}

type FilterType = 'all' | 'blood_test' | 'xray' | 'prescription' | 'other';

export default function DocumentsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get(`/documents?token=${token}`);
      setDocuments(response.data);
    } catch (error) {
      console.log('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredDocs(documents);
    } else {
      setFilteredDocs(documents.filter((d) => d.type === filter));
    }
  }, [filter, documents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Belgeyi Sil',
      'Bu belgeyi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/documents/${id}?token=${token}`);
              setDocuments(documents.filter((d) => d.id !== id));
            } catch (error) {
              Alert.alert('Hata', 'Belge silinemedi');
            }
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      blood_test: 'Kan Tahlili',
      xray: 'Röntgen',
      prescription: 'Reçete',
      other: 'Diğer',
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
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

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'blood_test', label: 'Kan Tahlili' },
    { key: 'xray', label: 'Röntgen' },
    { key: 'prescription', label: 'Reçete' },
    { key: 'other', label: 'Diğer' },
  ];

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.docCard}
      onPress={() => router.push(`/document/${item.id}`)}
    >
      <View style={styles.docIcon}>
        <Ionicons name={getTypeIcon(item.type)} size={24} color="#1E88E5" />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{item.title}</Text>
        <Text style={styles.docMeta}>
          {getTypeLabel(item.type)} • {formatDate(item.date)}
        </Text>
        {item.notes && (
          <Text style={styles.docNotes} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#E53935" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Belgelerim</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/upload')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Documents List */}
      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Belge Bulunamadı</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Henüz hiç belge yüklemediniz'
                : `${getTypeLabel(filter)} kategorisinde belge yok`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#1E88E5',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  docNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

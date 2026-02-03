import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  notes?: string;
  file_data: string;
  file_type: string;
  created_at: string;
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    if (!token || !id) return;
    try {
      const response = await api.get(`/documents/${id}?token=${token}`);
      setDocument(response.data);
    } catch (error) {
      Alert.alert('Hata', 'Belge yüklenemedi');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
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
              Alert.alert('Başarılı', 'Belge silindi');
              router.back();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#E53935" />
          <Text style={styles.errorText}>Belge bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Belge Detayı</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.typeIcon}>
              <Ionicons name={getTypeIcon(document.type)} size={32} color="#1E88E5" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.documentTitle}>{document.title}</Text>
              <Text style={styles.documentType}>{getTypeLabel(document.type)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Belge Tarihi:</Text>
            <Text style={styles.infoValue}>{formatDate(document.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Yüklenme:</Text>
            <Text style={styles.infoValue}>{formatDate(document.created_at)}</Text>
          </View>

          {document.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notlar:</Text>
              <Text style={styles.notesText}>{document.notes}</Text>
            </View>
          )}
        </View>

        {/* Document Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Belge Önizleme</Text>
          {document.file_type === 'image' ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${document.file_data}` }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pdfPreview}>
              <Ionicons name="document" size={64} color="#E53935" />
              <Text style={styles.pdfText}>PDF Belgesi</Text>
              <Text style={styles.pdfSubtext}>
                PDF önizleme bu sürümde desteklenmiyor
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#E53935',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#E3F2FD',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: width - 72,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  pdfPreview: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  pdfText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
  },
  pdfSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

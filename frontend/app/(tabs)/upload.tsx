import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

type DocumentType = 'blood_test' | 'xray' | 'prescription' | 'other';

export default function UploadScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('blood_test');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    base64: string;
    type: 'image' | 'pdf';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const documentTypes: { key: DocumentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'blood_test', label: 'Kan Tahlili', icon: 'water' },
    { key: 'xray', label: 'Röntgen', icon: 'scan' },
    { key: 'prescription', label: 'Reçete', icon: 'receipt' },
    { key: 'other', label: 'Diğer', icon: 'document' },
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf galerisine erişim izni vermeniz gerekiyor');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedFile({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        type: 'image',
      });
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni vermeniz gerekiyor');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedFile({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        type: 'image',
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Read file as base64
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setSelectedFile({
            uri: asset.uri,
            base64: base64,
            type: 'pdf',
          });
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      Alert.alert('Hata', 'Dosya seçilemedi');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen belge başlığı girin');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Hata', 'Lütfen bir dosya seçin');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/documents?token=${token}`, {
        title: title.trim(),
        type: documentType,
        date: new Date().toISOString(),
        notes: notes.trim() || null,
        file_data: selectedFile.base64,
        file_type: selectedFile.type,
      });

      Alert.alert('Başarılı', 'Belge başarıyla yüklendi', [
        {
          text: 'Tamam',
          onPress: () => {
            setTitle('');
            setNotes('');
            setSelectedFile(null);
            router.push('/(tabs)/documents');
          },
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Belge yüklenemedi';
      Alert.alert('Hata', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Belge Yükle</Text>
        </View>

        {/* Document Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Belge Türü</Text>
          <View style={styles.typeGrid}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeCard,
                  documentType === type.key && styles.typeCardActive,
                ]}
                onPress={() => setDocumentType(type.key)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={documentType === type.key ? '#1E88E5' : '#999'}
                />
                <Text
                  style={[
                    styles.typeText,
                    documentType === type.key && styles.typeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Başlık</Text>
          <TextInput
            style={styles.input}
            placeholder="Belge başlığı girin"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Notes Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar (Opsiyonel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ek notlar ekleyin"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* File Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dosya Seç</Text>
          
          {selectedFile ? (
            <View style={styles.previewContainer}>
              {selectedFile.type === 'image' ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.pdfPreview}>
                  <Ionicons name="document" size={48} color="#E53935" />
                  <Text style={styles.pdfText}>PDF Dosyası</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedFile(null)}
              >
                <Ionicons name="close-circle" size={28} color="#E53935" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                <Ionicons name="images" size={32} color="#1E88E5" />
                <Text style={styles.uploadOptionText}>Galeriden Seç</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#43A047" />
                <Text style={styles.uploadOptionText}>Fotoğraf Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
                <Ionicons name="document" size={32} color="#E53935" />
                <Text style={styles.uploadOptionText}>PDF Yükle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, isLoading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Belgeyi Yükle</Text>
            </>
          )}
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: '#1E88E5',
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  typeTextActive: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadOptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  previewContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  pdfPreview: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  pdfText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

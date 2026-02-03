import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const menuItems = [
    {
      icon: 'document-text-outline' as const,
      title: 'Belgelerim',
      subtitle: 'Tüm sağlık belgelerini görüntüle',
      onPress: () => router.push('/(tabs)/documents'),
    },
    {
      icon: 'chatbubbles-outline' as const,
      title: 'Sağlık Asistanı',
      subtitle: 'AI destekli sağlık danışmanı',
      onPress: () => router.push('/(tabs)/assistant'),
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Bildirimler',
      subtitle: 'Bildirim ayarlarını yönet',
      onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Gizlilik',
      subtitle: 'Gizlilik ve güvenlik ayarları',
      onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
    },
    {
      icon: 'help-circle-outline' as const,
      title: 'Yardım',
      subtitle: 'Sıkça sorulan sorular',
      onPress: () => Alert.alert('Yakında', 'Bu özellik yakında eklenecek'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#1E88E5" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          <Text style={styles.memberSince}>
            Üyelik: {formatDate(user?.created_at)}
          </Text>
        </View>

        {/* App Info Card */}
        <View style={styles.appInfoCard}>
          <View style={styles.appInfoHeader}>
            <Ionicons name="medical" size={32} color="#1E88E5" />
            <View style={styles.appInfoText}>
              <Text style={styles.appName}>VitaMed</Text>
              <Text style={styles.appVersion}>Versiyon 1.0.0</Text>
            </View>
          </View>
          <Text style={styles.appDescription}>
            Sağlık kayıtlarınızı güvenle saklayın ve yönetin. AI destekli sağlık
            asistanımız her zaman yanınızda.
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={24} color="#1E88E5" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          VitaMed © 2025 - Tüm hakları saklıdır
        </Text>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
  },
  appInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appInfoText: {
    marginLeft: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#E3F2FD',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
    marginLeft: 8,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
});

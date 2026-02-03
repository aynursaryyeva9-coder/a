import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { PrivacyPolicyView } from '../src/components/PrivacyPolicyView';

export default function Index() {
  const { user, isLoading, hasAcceptedPrivacy, acceptPrivacyPolicy } = useAuth();
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!hasAcceptedPrivacy) {
        setShowPrivacy(true);
      } else if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, hasAcceptedPrivacy]);

  const handleAcceptPrivacy = async () => {
    await acceptPrivacyPolicy();
    setShowPrivacy(false);
    
    // Navigate after accepting
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E88E5" />
      
      {/* Privacy Policy Modal - Cannot be dismissed */}
      <PrivacyPolicyView
        isVisible={showPrivacy}
        onAccept={handleAcceptPrivacy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

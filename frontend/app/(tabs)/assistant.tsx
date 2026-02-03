import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TypingIndicator = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })), -1);
    dot2.value = withRepeat(withSequence(withTiming(0, { duration: 150 }), withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })), -1);
    dot3.value = withRepeat(withSequence(withTiming(0, { duration: 300 }), withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })), -1);
  }, []);

  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingAvatar}>
        <Ionicons name="medical" size={16} color="#1E88E5" />
      </View>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, style1]} />
        <Animated.View style={[styles.typingDot, style2]} />
        <Animated.View style={[styles.typingDot, style3]} />
      </View>
    </View>
  );
};

export default function AssistantScreen() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const sendButtonScale = useSharedValue(1);

  const loadChatHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get(`/chat/history?token=${token}`);
      const history: Message[] = [];
      
      response.data.reverse().forEach((chat: any) => {
        history.push({
          id: `${chat.id}_user`,
          text: chat.user_message,
          isUser: true,
          timestamp: new Date(chat.created_at),
        });
        history.push({
          id: `${chat.id}_assistant`,
          text: chat.assistant_message,
          isUser: false,
          timestamp: new Date(chat.created_at),
        });
      });
      
      setMessages(history);
    } catch (error) {
      console.log('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (!isLoadingHistory && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: 'Merhaba! 👋 Ben VitaMed sağlık asistanınızım.\n\nSize genel sağlık bilgileri konusunda yardımcı olabilirim. Sorularınızı sorabilirsiniz.\n\n⚠️ Önemli: Tanı koyamam veya tedavi öneremem. Her zaman bir sağlık uzmanına danışmanızı öneririm.',
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  }, [isLoadingHistory, messages.length]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await api.post(`/chat?token=${token}`, {
        message: userMessage.text,
      });

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        text: response.data.assistant_message,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: '😔 Üzgünüm, şu an yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <Animated.View
      entering={item.isUser ? FadeInRight.delay(50).springify() : FadeInLeft.delay(50).springify()}
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.avatarContainer}>
          <Ionicons name="medical" size={18} color="#1E88E5" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.messageText, item.isUser && styles.userMessageText]}>
          {item.text}
        </Text>
      </View>
    </Animated.View>
  );

  const suggestedQuestions = [
    { icon: 'water', text: 'Kan tahlili sonuçlarım ne anlama geliyor?' },
    { icon: 'nutrition', text: 'Sağlıklı beslenme önerileri' },
    { icon: 'moon', text: 'Uyku düzeni nasıl iyileştirilir?' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="medical" size={24} color="#1E88E5" />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Sağlık Asistanı</Text>
              <Text style={styles.headerSubtitle}>AI Destekli • Her zaman yanınızda</Text>
            </View>
          </View>
        </Animated.View>

        {/* Messages */}
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          />
        )}

        {/* Suggested Questions */}
        {messages.length <= 1 && !isLoadingHistory && (
          <Animated.View entering={FadeIn.delay(300)} style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Önerilen Sorular</Text>
            {suggestedQuestions.map((question, index) => (
              <AnimatedTouchable
                key={index}
                entering={FadeInDown.delay(100 * index).springify()}
                style={styles.suggestionButton}
                onPress={() => setInputText(question.text)}
              >
                <View style={styles.suggestionIcon}>
                  <Ionicons name={question.icon as any} size={18} color="#1E88E5" />
                </View>
                <Text style={styles.suggestionText}>{question.text}</Text>
                <Ionicons name="arrow-forward" size={16} color="#B0BEC5" />
              </AnimatedTouchable>
            ))}
          </Animated.View>
        )}

        {/* Input */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Sorunuzu yazın..."
              placeholderTextColor="#90A4AE"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <AnimatedTouchable
            style={[
              styles.sendButton,
              sendButtonStyle,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            onPressIn={() => { sendButtonScale.value = withSpring(0.9); }}
            onPressOut={() => { sendButtonScale.value = withSpring(1); }}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={1}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </AnimatedTouchable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF4',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#78909C',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#78909C',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1E88E5',
    borderBottomRightRadius: 6,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#37474F',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  typingAvatar: {
    width: 36,
    height: 36,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: '#90CAF9',
    borderRadius: 4,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78909C',
    marginBottom: 12,
    marginLeft: 4,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#37474F',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8EEF4',
    marginRight: 12,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: '#263238',
    maxHeight: 100,
  },
  sendButton: {
    width: 52,
    height: 52,
    backgroundColor: '#1E88E5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0.1,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { Heart, MessageCircle, Trophy, Flame } from 'lucide-react-native';
import { userService } from '../services/userService';

interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'challenge_completed' | 'milestone_reached' | 'league_promoted';
  details: string;
  timestamp: string;
  celebrations: { userId: string; message: string; emoji: string }[];
}

export default function FriendsFeed() {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [celebrateModal, setCelebrateModal] = useState<{
    visible: boolean;
    activityId: string;
  }>({ visible: false, activityId: '' });
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');

  const emojis = ['🎉', '👏', '🔥', '💪', '🙏', '⭐', '❤️', '🚀'];

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const friendActivities = await userService.getFriendActivities();
    setActivities(friendActivities);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'challenge_completed':
        return <Trophy size={20} color="#3B82F6" />;
      case 'milestone_reached':
        return <Flame size={20} color="#EF4444" />;
      case 'league_promoted':
        return <Trophy size={20} color="#D4AF37" />;
      default:
        return <Heart size={20} color="#EF4444" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleCelebrate = (activityId: string) => {
    setCelebrateModal({ visible: true, activityId });
  };

  const submitCelebration = async () => {
    if (celebrationMessage.trim()) {
      await userService.celebrateActivity(
        celebrateModal.activityId,
        celebrationMessage,
        selectedEmoji
      );
      setCelebrateModal({ visible: false, activityId: '' });
      setCelebrationMessage('');
      setSelectedEmoji('🎉');
      loadActivities();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Friends</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Image source={{ uri: activity.userAvatar }} style={styles.avatar} />
              <View style={styles.activityInfo}>
                <View style={styles.activityTitleRow}>
                  {getActivityIcon(activity.type)}
                  <Text style={styles.userName}>{activity.userName}</Text>
                </View>
                <Text style={styles.activityDetails}>{activity.details}</Text>
                <Text style={styles.timestamp}>{getTimeAgo(activity.timestamp)}</Text>
              </View>
            </View>

            {activity.celebrations.length > 0 && (
              <View style={styles.celebrationsContainer}>
                {activity.celebrations.map((celebration, index) => (
                  <View key={index} style={styles.celebration}>
                    <Text style={styles.celebrationEmoji}>{celebration.emoji}</Text>
                    <Text style={styles.celebrationMessage}>{celebration.message}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.celebrateButton}
              onPress={() => handleCelebrate(activity.id)}
            >
              <Heart size={16} color="#EF4444" />
              <Text style={styles.celebrateText}>Celebrate</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={celebrateModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setCelebrateModal({ visible: false, activityId: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Encouragement! 🎉</Text>
            
            <View style={styles.emojiContainer}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.selectedEmoji
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.messageInput}
              placeholder="Write an encouraging message..."
              value={celebrationMessage}
              onChangeText={setCelebrationMessage}
              multiline
              maxLength={100}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCelebrateModal({ visible: false, activityId: '' })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={submitCelebration}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  celebrationsContainer: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  celebration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  celebrationEmoji: {
    fontSize: 16,
  },
  celebrationMessage: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  celebrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  celebrateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmoji: {
    backgroundColor: '#3B82F6',
  },
  emojiText: {
    fontSize: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
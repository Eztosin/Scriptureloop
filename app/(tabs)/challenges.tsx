import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Book, Target, Clock, Star, ChevronRight, CheckCircle, Play } from 'lucide-react-native';

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState([
    {
      id: 1,
      title: "Daily Reading",
      description: "Read today's scripture passage",
      xp: 50,
      difficulty: "Easy",
      completed: false,
      type: "reading",
      estimatedTime: "5-10 min"
    },
    {
      id: 2,
      title: "Memory Verse",
      description: "Memorize Psalm 23:1",
      xp: 100,
      difficulty: "Medium", 
      completed: false,
      type: "memory",
      estimatedTime: "10-15 min"
    },
    {
      id: 3,
      title: "Reflection Questions",
      description: "Answer 3 questions about faith",
      xp: 75,
      difficulty: "Easy",
      completed: true,
      type: "reflection",
      estimatedTime: "5 min"
    },
    {
      id: 4,
      title: "Scripture Connection",
      description: "Match verses to their themes",
      xp: 80,
      difficulty: "Medium",
      completed: false,
      type: "matching",
      estimatedTime: "8-12 min"
    }
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <Book size={20} color="#3B82F6" />;
      case 'memory': return <Target size={20} color="#8B5CF6" />;
      case 'reflection': return <Star size={20} color="#D4AF37" />;
      case 'matching': return <Play size={20} color="#EF4444" />;
      default: return <Book size={20} color="#6B7280" />;
    }
  };

  const handleChallengePress = (challengeId: number) => {
    router.push(`/challenge?id=${challengeId}`);
  };

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalXP = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xp, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Study Challenges</Text>
        <Text style={styles.subtitle}>Grow closer to God through daily study</Text>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressContainer}>
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressStats}>{completedChallenges}/{challenges.length} completed</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(completedChallenges / challenges.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.xpEarned}>+{totalXP} XP earned today</Text>
        </LinearGradient>
      </View>

      {/* Challenges List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Challenges</Text>
        {challenges.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={[
              styles.challengeCard,
              challenge.completed && styles.completedCard
            ]}
            onPress={() => handleChallengePress(challenge.id)}
            disabled={challenge.completed}
          >
            <View style={styles.challengeContent}>
              <View style={styles.challengeLeft}>
                <View style={styles.typeIconContainer}>
                  {getTypeIcon(challenge.type)}
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={[
                    styles.challengeTitle,
                    challenge.completed && styles.completedText
                  ]}>
                    {challenge.title}
                  </Text>
                  <Text style={styles.challengeDescription}>
                    {challenge.description}
                  </Text>
                  <View style={styles.challengeMeta}>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(challenge.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Clock size={12} color="#6B7280" />
                      <Text style={styles.timeText}>{challenge.estimatedTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.challengeRight}>
                {challenge.completed ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : (
                  <View style={styles.xpBadge}>
                    <Star size={16} color="#D4AF37" />
                    <Text style={styles.xpText}>+{challenge.xp}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressCard: {
    borderRadius: 16,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressStats: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  xpEarned: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  challengeCard: {
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
  completedCard: {
    opacity: 0.6,
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  challengeRight: {
    alignItems: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, Lock, Play, Clock, Star, Target } from 'lucide-react-native';

interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: string;
  xp: number;
  completed: boolean;
  locked: boolean;
  type: 'reading' | 'reflection' | 'memory' | 'quiz';
}

export default function LearningPathScreen() {
  const { id } = useLocalSearchParams();
  
  const pathData = {
    1: {
      title: "Faith",
      description: "Strengthen your faith through God's promises",
      color: '#3B82F6',
      icon: '🙏',
      progress: 65,
      lessons: [
        { id: 1, title: "What is Faith?", description: "Understanding biblical faith", duration: "8 min", xp: 50, completed: true, locked: false, type: 'reading' as const },
        { id: 2, title: "Faith vs. Doubt", description: "Overcoming spiritual doubts", duration: "10 min", xp: 75, completed: true, locked: false, type: 'reflection' as const },
        { id: 3, title: "Heroes of Faith", description: "Learning from Hebrews 11", duration: "12 min", xp: 60, completed: true, locked: false, type: 'quiz' as const },
        { id: 4, title: "Faith in Action", description: "James 2:14-26 study", duration: "15 min", xp: 80, completed: false, locked: false, type: 'reading' as const },
        { id: 5, title: "Mustard Seed Faith", description: "Matthew 17:20 meditation", duration: "10 min", xp: 70, completed: false, locked: false, type: 'memory' as const },
        { id: 6, title: "Faith Through Trials", description: "1 Peter 1:6-7 reflection", duration: "12 min", xp: 90, completed: false, locked: true, type: 'reflection' as const },
      ]
    },
    2: {
      title: "Love",
      description: "Discover God's love and learn to love others",
      color: '#EF4444',
      icon: '❤️',
      progress: 40,
      lessons: [
        { id: 1, title: "God's Love for Us", description: "1 John 4:19 study", duration: "10 min", xp: 50, completed: true, locked: false, type: 'reading' as const },
        { id: 2, title: "Love Your Neighbor", description: "Mark 12:31 exploration", duration: "12 min", xp: 60, completed: true, locked: false, type: 'reflection' as const },
        { id: 3, title: "Love's Definition", description: "1 Corinthians 13 deep dive", duration: "15 min", xp: 80, completed: false, locked: false, type: 'quiz' as const },
        { id: 4, title: "Loving Enemies", description: "Matthew 5:44 challenge", duration: "14 min", xp: 90, completed: false, locked: true, type: 'reflection' as const },
      ]
    }
  };

  const currentPath = pathData[id as keyof typeof pathData] || pathData[1];
  const [lessons, setLessons] = useState<Lesson[]>(currentPath.lessons);

  const completedLessons = lessons.filter(l => l.completed).length;
  const totalXP = lessons.filter(l => l.completed).reduce((sum, l) => sum + l.xp, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <Play size={16} color="#3B82F6" />;
      case 'reflection': return <Target size={16} color="#8B5CF6" />;
      case 'memory': return <Star size={16} color="#D4AF37" />;
      case 'quiz': return <CheckCircle size={16} color="#10B981" />;
      default: return <Play size={16} color="#6B7280" />;
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (lesson.locked) {
      Alert.alert(
        "Lesson Locked",
        "Complete previous lessons to unlock this one."
      );
      return;
    }
    
    if (lesson.completed) {
      Alert.alert(
        "Lesson Completed",
        "You've already completed this lesson. Would you like to review it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Review", onPress: () => startLesson(lesson) }
        ]
      );
    } else {
      startLesson(lesson);
    }
  };

  const startLesson = (lesson: Lesson) => {
    // Navigate to specific lesson type
    router.push(`/challenge?type=${lesson.type}&lessonId=${lesson.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[currentPath.color, currentPath.color + '80']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.pathIcon}>{currentPath.icon}</Text>
          <Text style={styles.headerTitle}>{currentPath.title}</Text>
          <Text style={styles.headerSubtitle}>{currentPath.description}</Text>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${currentPath.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedLessons}/{lessons.length} lessons completed
          </Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.statNumber}>{completedLessons}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Star size={20} color="#D4AF37" />
          <Text style={styles.statNumber}>{totalXP}</Text>
          <Text style={styles.statLabel}>XP Earned</Text>
        </View>
        
        <View style={styles.statCard}>
          <Target size={20} color="#8B5CF6" />
          <Text style={styles.statNumber}>{lessons.length - completedLessons}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>

      {/* Lessons */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lessons</Text>
          
          {lessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.id}
              style={[
                styles.lessonCard,
                lesson.completed && styles.completedLesson,
                lesson.locked && styles.lockedLesson
              ]}
              onPress={() => handleLessonPress(lesson)}
              disabled={lesson.locked}
            >
              <View style={styles.lessonContent}>
                <View style={styles.lessonLeft}>
                  <View style={[
                    styles.lessonNumber,
                    lesson.completed && styles.completedNumber,
                    lesson.locked && styles.lockedNumber
                  ]}>
                    {lesson.completed ? (
                      <CheckCircle size={24} color="#10B981" />
                    ) : lesson.locked ? (
                      <Lock size={20} color="#9CA3AF" />
                    ) : (
                      <Text style={styles.numberText}>{index + 1}</Text>
                    )}
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <Text style={[
                      styles.lessonTitle,
                      lesson.locked && styles.lockedText
                    ]}>
                      {lesson.title}
                    </Text>
                    <Text style={[
                      styles.lessonDescription,
                      lesson.locked && styles.lockedText
                    ]}>
                      {lesson.description}
                    </Text>
                    <View style={styles.lessonMeta}>
                      {getTypeIcon(lesson.type)}
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.durationText}>{lesson.duration}</Text>
                      <Star size={14} color="#D4AF37" />
                      <Text style={styles.xpText}>+{lesson.xp} XP</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pathIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  progressSection: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
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
  lessonCard: {
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
  completedLesson: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  lockedLesson: {
    opacity: 0.5,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  completedNumber: {
    backgroundColor: '#DCFCE7',
  },
  lockedNumber: {
    backgroundColor: '#F9FAFB',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
  },
});
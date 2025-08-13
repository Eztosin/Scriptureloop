import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Check, X, Star } from 'lucide-react-native';
import { challengeService, type DailyChallenge, type Question } from '../../services/challengeService';

export default function ChallengeScreen() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadTodaysChallenge();
    checkCompletionStatus();
  }, []);

  const checkCompletionStatus = async () => {
    try {
      const { userService } = await import('../../services/userService.production');
      const user = await userService.getCurrentUser();
      if (user?.stats?.today_completed) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Error checking completion status:', error);
    }
  };

  const loadTodaysChallenge = async () => {
    try {
      const todaysChallenge = await challengeService.getTodaysChallenge();
      setChallenge(todaysChallenge);
    } catch (error) {
      console.error('Failed to load challenge:', error);
      Alert.alert('Error', 'Failed to load today\'s challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (selectedAnswer === challenge!.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion < challenge!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Challenge completed
      completeChallenge(newAnswers);
    }
  };

  const completeChallenge = async (finalAnswers: number[]) => {
    const finalScore = finalAnswers.reduce((acc, answer, index) => {
      return acc + (answer === challenge!.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    const xpEarned = finalScore * 20; // 20 XP per correct answer
    const bonusXP = finalScore === challenge!.questions.length ? 30 : 0; // Perfect score bonus

    // Save challenge completion
    try {
      await challengeService.completeChallenge(
        challenge!.date,
        finalAnswers,
        finalScore
      );
    } catch (error) {
      console.error('Failed to save challenge completion:', error);
    }

    Alert.alert(
      'Challenge Complete! 🎉',
      `Score: ${finalScore}/${challenge!.questions.length}\nXP Earned: ${xpEarned + bonusXP}`,
      [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)')
        }
      ]
    );
  };

  const showAnswerResult = () => {
    setShowResult(true);
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  if (loading || !challenge) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading today's challenge...</Text>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Challenge</Text>
          <View />
        </View>
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedTitle}>Challenge Complete!</Text>
          <Text style={styles.completedMessage}>You've already completed today's challenge. Come back tomorrow for a new one!</Text>
          <TouchableOpacity 
            style={styles.completedButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.completedButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQ = challenge.questions[currentQuestion];
  const isCorrect = selectedAnswer === currentQ.correctAnswer;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Challenge</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentQuestion + 1}/{challenge.questions.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bible Verse */}
        <View style={styles.verseContainer}>
          <Text style={styles.verseText}>"{challenge.verse.text}"</Text>
          <Text style={styles.verseReference}>— {challenge.verse.reference}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.selectedOption,
                showResult && index === currentQ.correctAnswer && styles.correctOption,
                showResult && selectedAnswer === index && index !== currentQ.correctAnswer && styles.incorrectOption,
              ]}
              onPress={() => !showResult && handleAnswerSelect(index)}
              disabled={showResult}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.selectedOptionText,
                showResult && index === currentQ.correctAnswer && styles.correctOptionText,
                showResult && selectedAnswer === index && index !== currentQ.correctAnswer && styles.incorrectOptionText,
              ]}>
                {option}
              </Text>
              {showResult && index === currentQ.correctAnswer && (
                <Check size={20} color="#FFFFFF" />
              )}
              {showResult && selectedAnswer === index && index !== currentQ.correctAnswer && (
                <X size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        {showResult && (
          <View style={styles.explanationContainer}>
            <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
              {isCorrect ? <Check size={16} color="#FFFFFF" /> : <X size={16} color="#FFFFFF" />}
              <Text style={styles.resultText}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {!showResult && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, selectedAnswer === null && styles.disabledButton]}
            onPress={showAnswerResult}
            disabled={selectedAnswer === null}
          >
            <LinearGradient
              colors={selectedAnswer !== null ? ['#3B82F6', '#1E40AF'] : ['#9CA3AF', '#6B7280']}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {currentQuestion === challenge.questions.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  verseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  correctOption: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  incorrectOption: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  explanationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  correctBadge: {
    backgroundColor: '#10B981',
  },
  incorrectBadge: {
    backgroundColor: '#EF4444',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completedIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  completedMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  completedButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
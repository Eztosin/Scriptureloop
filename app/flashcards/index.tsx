import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  X,
  Star,
  RefreshCw
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Flashcard {
  id: number;
  verse: string;
  reference: string;
  category: string;
}

export default function FlashcardsScreen() {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [cardStack, setCardStack] = useState<Flashcard[]>([
    {
      id: 1,
      verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
      category: "Salvation"
    },
    {
      id: 2,
      verse: "I can do all this through him who gives me strength.",
      reference: "Philippians 4:13",
      category: "Strength"
    },
    {
      id: 3,
      verse: "The Lord is my shepherd, I lack nothing.",
      reference: "Psalm 23:1",
      category: "Comfort"
    },
    {
      id: 4,
      verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
      reference: "Joshua 1:9",
      category: "Courage"
    },
    {
      id: 5,
      verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      reference: "Romans 8:28",
      category: "Hope"
    }
  ]);

  const handleFlipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const handleCorrect = () => {
    setCorrectCount(correctCount + 1);
    nextCard();
  };

  const handleIncorrect = () => {
    nextCard();
  };

  const nextCard = () => {
    if (currentCard < cardStack.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    } else {
      completeSession();
    }
  };

  const completeSession = () => {
    const xpEarned = correctCount * 20;
    Alert.alert(
      "Session Complete! 🎉",
      `You got ${correctCount}/${cardStack.length} correct!\nXP Earned: +${xpEarned}`,
      [
        { text: "Study Again", onPress: resetSession },
        { text: "Done", onPress: () => router.back() }
      ]
    );
  };

  const resetSession = () => {
    setCurrentCard(0);
    setShowAnswer(false);
    setCorrectCount(0);
  };

  const progress = ((currentCard + 1) / cardStack.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#A855F7']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Memory Verses</Text>
          <Text style={styles.headerSubtitle}>
            Card {currentCard + 1} of {cardStack.length}
          </Text>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetSession}>
          <RefreshCw size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </LinearGradient>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.flashcard}
          onPress={handleFlipCard}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={showAnswer ? ['#10B981', '#059669'] : ['#FFFFFF', '#F8FAFC']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Text style={[
                styles.categoryBadge,
                showAnswer && styles.answerCategoryBadge
              ]}>
                {cardStack[currentCard].category}
              </Text>
              <TouchableOpacity onPress={handleFlipCard}>
                <RotateCcw size={20} color={showAnswer ? "#FFFFFF" : "#6B7280"} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardContent}>
              {!showAnswer ? (
                <>
                  <Text style={styles.verseText}>
                    "{cardStack[currentCard].verse}"
                  </Text>
                  <Text style={styles.tapHint}>Tap to reveal reference</Text>
                </>
              ) : (
                <>
                  <Text style={styles.referenceText}>
                    {cardStack[currentCard].reference}
                  </Text>
                  <Text style={styles.memoryHint}>
                    How well did you remember this verse?
                  </Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {showAnswer && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.incorrectButton]}
            onPress={handleIncorrect}
          >
            <X size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Needs Work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.correctButton]}
            onPress={handleCorrect}
          >
            <Check size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Got It!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCard}>
          <Star size={20} color="#D4AF37" />
          <Text style={styles.scoreText}>
            {correctCount}/{cardStack.length} correct
          </Text>
        </View>
      </View>
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
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  resetButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'center',
  },
  flashcard: {
    height: 400,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  answerCategoryBadge: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1F2937',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  referenceText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  memoryHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  incorrectButton: {
    backgroundColor: '#EF4444',
  },
  correctButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
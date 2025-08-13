import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, Book, Trophy, Zap, Shield } from 'lucide-react-native';

const BIBLE_TRANSLATIONS = [
  { id: 'niv', name: 'New International Version', abbr: 'NIV' },
  { id: 'esv', name: 'English Standard Version', abbr: 'ESV' },
  { id: 'kjv', name: 'King James Version', abbr: 'KJV' },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTranslation, setSelectedTranslation] = useState('niv');

  const steps = [
    {
      title: 'Welcome to ScriptureLoop! 📖',
      subtitle: 'Build consistent Bible study habits',
      content: (
        <Text style={styles.description}>
          Join believers growing in faith through daily Scripture study, streaks, and community.
        </Text>
      )
    },
    {
      title: 'Choose Bible Translation',
      subtitle: 'Select your preferred version',
      content: (
        <View>
          {BIBLE_TRANSLATIONS.map((translation) => (
            <TouchableOpacity
              key={translation.id}
              style={[
                styles.translationCard,
                selectedTranslation === translation.id && styles.selectedTranslation
              ]}
              onPress={() => setSelectedTranslation(translation.id)}
            >
              <Text style={styles.translationName}>{translation.name}</Text>
              <Text style={styles.translationAbbr}>{translation.abbr}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )
    },
    {
      title: 'How It Works',
      subtitle: 'Earn XP, maintain streaks, level up',
      content: (
        <View>
          <View style={styles.featureItem}>
            <Book size={24} color="#3B82F6" />
            <Text style={styles.featureTitle}>Daily Challenges</Text>
          </View>
          <View style={styles.featureItem}>
            <Trophy size={24} color="#D4AF37" />
            <Text style={styles.featureTitle}>Weekly Leagues</Text>
          </View>
          <View style={styles.featureItem}>
            <Zap size={24} color="#7C3AED" />
            <Text style={styles.featureTitle}>Gems & Boosters</Text>
          </View>
          <View style={styles.featureItem}>
            <Shield size={24} color="#10B981" />
            <Text style={styles.featureTitle}>Grace Pass</Text>
          </View>
        </View>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.header}>
        <Text style={styles.title}>{steps[currentStep].title}</Text>
        <Text style={styles.subtitle}>{steps[currentStep].subtitle}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {steps[currentStep].content}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.nextButtonGradient}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Start Journey' : 'Continue'}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  translationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTranslation: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  translationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  translationAbbr: {
    fontSize: 14,
    color: '#6B7280',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  nextButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
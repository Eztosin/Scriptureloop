interface BibleVerse {
  text: string;
  reference: string;
  book: string;
  chapter: number;
  verse: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface DailyChallenge {
  verse: BibleVerse;
  questions: Question[];
  date: string;
}

class ChallengeService {
  private readonly BIBLE_API_URL = 'https://bible-api.com';
  
  // Curated verses for daily challenges
  private readonly DAILY_VERSES = [
    'john 3:16',
    'romans 8:28',
    'philippians 4:13',
    'proverbs 3:5-6',
    'jeremiah 29:11',
    'matthew 28:19-20',
    'ephesians 2:8-9',
    '1 corinthians 13:4-7',
    'psalm 23:1-4',
    'isaiah 40:31',
    'romans 12:2',
    'galatians 5:22-23',
    'matthew 6:33',
    'joshua 1:9',
    '2 timothy 3:16-17',
    'hebrews 11:1',
    'james 1:2-4',
    '1 peter 5:7',
    'matthew 5:14-16',
    'colossians 3:23-24'
  ];

  async getTodaysChallenge(): Promise<DailyChallenge> {
    const today = new Date().toISOString().split('T')[0];
    
    // Use date to select consistent daily verse
    const dayOfYear = this.getDayOfYear(new Date());
    const verseIndex = dayOfYear % this.DAILY_VERSES.length;
    const selectedVerse = this.DAILY_VERSES[verseIndex];

    try {
      const verse = await this.fetchBibleVerse(selectedVerse);
      const questions = this.generateQuestions(verse);
      
      return {
        verse,
        questions,
        date: today
      };
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
      return this.getFallbackChallenge(today);
    }
  }

  private async fetchBibleVerse(reference: string): Promise<BibleVerse> {
    const response = await fetch(`${this.BIBLE_API_URL}/${reference}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Bible verse');
    }

    const data = await response.json();
    
    return {
      text: data.text.trim(),
      reference: data.reference,
      book: data.verses[0].book_name,
      chapter: data.verses[0].chapter,
      verse: data.verses[0].verse
    };
  }

  private generateQuestions(verse: BibleVerse): Question[] {
    // This is a simplified question generator
    // In production, you'd want more sophisticated NLP or pre-written questions
    const questions: Question[] = [];
    
    // Question templates based on common Bible study patterns
    const templates = this.getQuestionTemplates(verse);
    
    return templates.slice(0, 3); // Return 3 questions per challenge
  }

  private getQuestionTemplates(verse: BibleVerse): Question[] {
    const text = verse.text.toLowerCase();
    const questions: Question[] = [];

    // Template 1: Key word identification
    if (text.includes('love')) {
      questions.push({
        id: 1,
        question: "What is the main theme of this verse?",
        options: ["Fear", "Love", "Anger", "Doubt"],
        correctAnswer: 1,
        explanation: "This verse emphasizes the theme of love."
      });
    }

    if (text.includes('faith')) {
      questions.push({
        id: 2,
        question: "According to this passage, what is important for believers?",
        options: ["Wealth", "Fame", "Faith", "Power"],
        correctAnswer: 2,
        explanation: "The passage highlights the importance of faith."
      });
    }

    if (text.includes('god') || text.includes('lord')) {
      questions.push({
        id: 3,
        question: "Who is the central figure in this verse?",
        options: ["Humans", "Angels", "God/Lord", "Prophets"],
        correctAnswer: 2,
        explanation: "God/Lord is the central figure mentioned in this verse."
      });
    }

    // Template 2: Book identification
    questions.push({
      id: questions.length + 1,
      question: `Which book of the Bible is this verse from?`,
      options: this.generateBookOptions(verse.book),
      correctAnswer: 0, // First option is always correct
      explanation: `This verse is from the book of ${verse.book}.`
    });

    // Template 3: Application question
    questions.push({
      id: questions.length + 1,
      question: "How can this verse be applied to daily life?",
      options: [
        "By trusting in God's plan",
        "By ignoring difficulties",
        "By avoiding other people",
        "By focusing only on work"
      ],
      correctAnswer: 0,
      explanation: "This verse encourages us to trust in God's plan for our lives."
    });

    return questions;
  }

  private generateBookOptions(correctBook: string): string[] {
    const commonBooks = [
      'Genesis', 'Exodus', 'Psalms', 'Proverbs', 'Isaiah', 'Jeremiah',
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', 'Corinthians',
      'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Hebrews',
      'James', 'Peter', 'Revelation'
    ];

    const options = [correctBook];
    
    // Add 3 random incorrect options
    while (options.length < 4) {
      const randomBook = commonBooks[Math.floor(Math.random() * commonBooks.length)];
      if (!options.includes(randomBook)) {
        options.push(randomBook);
      }
    }

    // Shuffle options but keep correct answer at index 0 for now
    const shuffled = [options[0], ...this.shuffleArray(options.slice(1))];
    return shuffled;
  }

  private getFallbackChallenge(date: string): DailyChallenge {
    return {
      verse: {
        text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        reference: "John 3:16",
        book: "John",
        chapter: 3,
        verse: "16"
      },
      questions: [
        {
          id: 1,
          question: "What did God give to the world?",
          options: ["His wisdom", "His one and only Son", "His power", "His throne"],
          correctAnswer: 1,
          explanation: "God gave His one and only Son to the world."
        },
        {
          id: 2,
          question: "What must someone do to have eternal life?",
          options: ["Be perfect", "Believe in Him", "Give money", "Be famous"],
          correctAnswer: 1,
          explanation: "The verse states that whoever believes in Him shall have eternal life."
        },
        {
          id: 3,
          question: "Which book is this verse from?",
          options: ["John", "Matthew", "Luke", "Mark"],
          correctAnswer: 0,
          explanation: "This famous verse is from the Gospel of John."
        }
      ],
      date
    };
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Save challenge completion
  async completeChallenge(challengeId: string, answers: number[], score: number): Promise<void> {
    const xpEarned = score * 20; // 20 XP per correct answer
    const bonusXP = score === 3 ? 30 : 0; // Perfect score bonus
    const totalXP = xpEarned + bonusXP;

    try {
      // Import userService dynamically to avoid circular dependencies
      const { userService } = await import('./userService.production');
      
      // Add XP and update streak
      await userService.addXP(totalXP, 'daily_challenge');
      const streakResult = await userService.updateStreak();
      
      // Refresh user data to ensure completion status is updated
      await userService.refreshUserData();
      
      // Check if streak was broken and offer Grace Pass
      if (streakResult.streakBroken) {
        // Import router dynamically to avoid issues
        const { router } = await import('expo-router');
        
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const offerGracePass = window.confirm(
              `Your ${streakResult.previousStreak}-day streak was broken! \n\nWould you like to restore it with a Grace Pass for $0.99?`
            );
            
            if (offerGracePass) {
              router.push('/grace-pass');
            }
          }
        }, 2000); // Show after completion celebration
      }
      
      console.log('Challenge completed successfully:', {
        challengeId,
        score,
        totalQuestions: 3,
        xpEarned: totalXP,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving challenge completion:', error);
      throw error;
    }
  }
}

export const challengeService = new ChallengeService();
export type { DailyChallenge, Question, BibleVerse };
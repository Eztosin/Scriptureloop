interface BibleVerse {
  text: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
}

interface DailyPassage {
  text: string;
  reference: string;
  theme: string;
}

class BibleApiService {
  private readonly baseUrl = 'https://bible-api.com';
  
  // Cache for daily verses to avoid repeated API calls
  private verseCache: Map<string, any> = new Map();

  async getRandomVerse(): Promise<BibleVerse> {
    // Popular inspirational verses for demo
    const popularVerses = [
      'john 3:16',
      'philippians 4:13',
      'psalm 23:1',
      'romans 8:28',
      'jeremiah 29:11',
      'matthew 28:20',
      'isaiah 40:31',
      'proverbs 3:5-6',
      '1 corinthians 13:4-7',
      'psalm 46:10'
    ];
    
    const randomVerse = popularVerses[Math.floor(Math.random() * popularVerses.length)];
    return this.getVerse(randomVerse);
  }

  async getVerse(reference: string, translation: string = 'kjv'): Promise<BibleVerse> {
    try {
      const cacheKey = `${reference.toLowerCase()}_${translation}`;
      
      if (this.verseCache.has(cacheKey)) {
        return this.verseCache.get(cacheKey);
      }

      // Check connection first
      const isOnline = await this.checkConnection();
      if (!isOnline) {
        return this.getFallbackVerse();
      }

      const response = await fetch(`${this.baseUrl}/${reference}?translation=${translation}`, {
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Invalid verse reference or translation not available');
      }
      
      const verse: BibleVerse = {
        text: this.cleanVerseText(data.text),
        reference: data.reference,
        book: data.reference.split(' ')[0],
        chapter: parseInt(data.reference.match(/\d+/)?.[0] || '1'),
        verse: parseInt(data.reference.split(':')[1] || '1')
      };
      
      this.verseCache.set(cacheKey, verse);
      return verse;
      
    } catch (error) {
      console.error('Bible API Error:', error);
      return this.getFallbackVerse();
    }
  }
  
  private async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private cleanVerseText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  }
  
  private getFallbackVerse(): BibleVerse {
    return {
      text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6",
      book: "Proverbs",
      chapter: 3,
      verse: 5
    };
  }
  
  validateTranslation(translation: string): boolean {
    const supportedTranslations = ['kjv', 'niv', 'esv', 'nlt', 'nasb', 'nkjv'];
    return supportedTranslations.includes(translation.toLowerCase());
  }

  async getDailyPassage(): Promise<DailyPassage> {
    // Theme-based passages for daily challenges
    const dailyPassages = [
      {
        reference: 'proverbs 3:5-6',
        theme: 'Trust and Guidance'
      },
      {
        reference: 'psalm 23:1-4',
        theme: 'God\'s Protection'
      },
      {
        reference: 'matthew 6:25-26',
        theme: 'Freedom from Worry'
      },
      {
        reference: 'romans 8:28',
        theme: 'God\'s Purpose'
      },
      {
        reference: '1 corinthians 13:4-7',
        theme: 'Love\'s Character'
      }
    ];

    // Select passage based on day of year for consistency
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const selectedPassage = dailyPassages[dayOfYear % dailyPassages.length];
    
    const verse = await this.getVerse(selectedPassage.reference);
    
    return {
      text: verse.text,
      reference: verse.reference,
      theme: selectedPassage.theme
    };
  }

  async getVersesForTheme(theme: string): Promise<BibleVerse[]> {
    const themeVerses: Record<string, string[]> = {
      'faith': ['hebrews 11:1', 'romans 10:17', 'matthew 17:20'],
      'love': ['1 john 4:19', '1 corinthians 13:13', 'john 15:12'],
      'forgiveness': ['ephesians 4:32', 'matthew 6:14', 'colossians 3:13'],
      'growth': ['2 peter 3:18', 'philippians 1:6', '1 peter 2:2']
    };

    const verses = themeVerses[theme.toLowerCase()] || themeVerses['faith'];
    const results: BibleVerse[] = [];
    
    for (const verse of verses) {
      try {
        const result = await this.getVerse(verse);
        results.push(result);
      } catch (error) {
        console.error(`Failed to fetch ${verse}:`, error);
      }
    }
    
    return results;
  }

  // Generate questions based on a verse
  generateQuestions(verse: BibleVerse): any[] {
    // This would typically be handled by AI or a question database
    // For demo purposes, we'll return sample questions
    return [
      {
        id: 1,
        text: `What is the main theme of ${verse.reference}?`,
        options: [
          "God's love and provision",
          "Human wisdom",
          "Material wealth",
          "Social status"
        ],
        correctAnswer: 0,
        explanation: "This verse emphasizes God's love and care for His people."
      }
    ];
  }
}

export const bibleApi = new BibleApiService();
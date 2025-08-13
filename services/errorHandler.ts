import { Alert } from 'react-native';

interface ErrorConfig {
  showAlert?: boolean;
  fallbackMessage?: string;
  logError?: boolean;
}

class ErrorHandler {
  handleApiError(error: any, config: ErrorConfig = {}): void {
    const {
      showAlert = true,
      fallbackMessage = "Something went wrong. Please try again.",
      logError = true
    } = config;

    if (logError) {
      console.error('API Error:', error);
    }

    let userMessage = fallbackMessage;

    if (error?.message?.includes('network')) {
      userMessage = "Please check your internet connection and try again.";
    } else if (error?.status === 429) {
      userMessage = "Too many requests. Please wait a moment and try again.";
    } else if (error?.status >= 500) {
      userMessage = "Our servers are having issues. Please try again later.";
    }

    if (showAlert) {
      Alert.alert("Oops!", userMessage, [{ text: "OK" }]);
    }
  }

  handleBibleApiError(error: any): string {
    console.error('Bible API Error:', error);
    
    if (error?.message?.includes('translation')) {
      return "This Bible translation is not available. Please try another.";
    }
    
    return "Unable to load Bible content. Please check your connection.";
  }

  handlePurchaseError(error: any): string {
    console.error('Purchase Error:', error);
    
    if (error?.code === 'user_cancelled') {
      return "Purchase was cancelled.";
    } else if (error?.code === 'payment_pending') {
      return "Payment is being processed. Please wait.";
    } else if (error?.code === 'product_not_available') {
      return "This item is not available for purchase.";
    }
    
    return "Purchase failed. Please try again.";
  }

  validateUserData(userData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!userData) {
      errors.push('User data is missing');
      return { isValid: false, errors };
    }

    if (!userData.stats) {
      errors.push('User stats are missing');
    } else {
      if (typeof userData.stats.xp !== 'number' || userData.stats.xp < 0) {
        userData.stats.xp = 0;
        errors.push('Invalid XP value, reset to 0');
      }
      
      if (typeof userData.stats.streak !== 'number' || userData.stats.streak < 0) {
        userData.stats.streak = 0;
        errors.push('Invalid streak value, reset to 0');
      }
      
      if (typeof userData.stats.gems !== 'number' || userData.stats.gems < 0) {
        userData.stats.gems = 0;
        errors.push('Invalid gems value, reset to 0');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  safeJsonParse(jsonString: string, fallback: any = null): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      return fallback;
    }
  }
}

export const errorHandler = new ErrorHandler();
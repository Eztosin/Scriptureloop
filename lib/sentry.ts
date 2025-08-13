import * as Sentry from '@sentry/react-native';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
  });
};

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; username?: string }) => {
  Sentry.setUser(user);
};

export const addBreadcrumb = (message: string, category?: string, data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    level: 'info',
  });
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { errorHandler } from './errorHandler';

interface OfflineAction {
  id: string;
  type: 'xp_update' | 'streak_update' | 'challenge_complete' | 'update_stats';
  data: any;
  timestamp: string;
  idempotencyKey: string;
}

class OfflineService {
  private readonly queueKey = 'offline_actions_queue';

  async isOnline(): Promise<boolean> {
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

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'idempotencyKey'>): Promise<void> {
    const queuedAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      idempotencyKey: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const queue = await this.getQueue();
    queue.push(queuedAction);
    await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  async processQueue(): Promise<void> {
    const online = await this.isOnline();
    if (!online) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const queue = await this.getQueue();
    const processed: string[] = [];

    for (const action of queue) {
      try {
        // Check if action was already processed server-side
        const { data: existing } = await supabase
          .from('offline_actions')
          .select('processed')
          .eq('user_id', user.id)
          .eq('idempotency_key', action.idempotencyKey)
          .single();

        if (existing?.processed) {
          processed.push(action.id);
          continue;
        }

        // Insert action record for idempotency
        await supabase.from('offline_actions').upsert({
          user_id: user.id,
          action_type: action.type,
          action_data: action.data,
          idempotency_key: action.idempotencyKey,
          processed: false,
        });

        // Process the action
        await this.processAction(action);
        
        // Mark as processed
        await supabase
          .from('offline_actions')
          .update({ processed: true })
          .eq('user_id', user.id)
          .eq('idempotency_key', action.idempotencyKey);

        processed.push(action.id);
      } catch (error) {
        errorHandler.handleApiError(error);
      }
    }

    const remainingQueue = queue.filter(action => !processed.includes(action.id));
    await AsyncStorage.setItem(this.queueKey, JSON.stringify(remainingQueue));
  }

  private async getQueue(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem(this.queueKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    switch (action.type) {
      case 'update_stats':
        await supabase
          .from('user_stats')
          .update(action.data.updates)
          .eq('user_id', user.id);
        break;
      case 'xp_update':
        await supabase.from('xp_transactions').insert({
          user_id: user.id,
          amount: action.data.amount,
          source: action.data.source,
          multiplier: action.data.multiplier || 1,
        });
        break;
      case 'challenge_complete':
        await supabase.from('friend_activities').insert({
          user_id: user.id,
          type: 'challenge_completed',
          details: action.data.details,
        });
        break;
    }
  }

  async getCachedVerses(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem('cached_verses');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  async cacheVerses(verses: any[]): Promise<void> {
    await AsyncStorage.setItem('cached_verses', JSON.stringify(verses));
  }
}

export const offlineService = new OfflineService();
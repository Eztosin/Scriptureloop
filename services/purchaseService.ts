import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesEntitlementInfo 
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { errorHandler } from './errorHandler';

interface PurchaseProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  type: 'consumable' | 'subscription';
}

class PurchaseService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS!,
        android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID!,
      });

      if (!apiKey) {
        throw new Error('RevenueCat API key not found');
      }

      await Purchases.configure({ apiKey });
      this.isInitialized = true;
    } catch (error) {
      errorHandler.handleApiError(error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchaseProduct[]> {
    try {
      await this.initialize();
      
      const offerings = await Purchases.getOfferings();
      const products: PurchaseProduct[] = [];

      if (offerings.current) {
        offerings.current.availablePackages.forEach(pkg => {
          products.push({
            id: pkg.identifier,
            title: pkg.product.title,
            description: pkg.product.description,
            price: pkg.product.priceString,
            type: pkg.product.productType === 'subs' ? 'subscription' : 'consumable',
          });
        });
      }

      return products;
    } catch (error) {
      errorHandler.handleApiError(error);
      return [];
    }
  }

  async purchasePackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();

      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(p => p.identifier === packageId);

      if (!pkg) {
        return { success: false, error: 'Product not found' };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Check if purchase was successful
      const entitlement = this.getEntitlementForPackage(packageId, customerInfo);
      
      return { 
        success: entitlement?.isActive || false,
        error: entitlement?.isActive ? undefined : 'Purchase verification failed'
      };
    } catch (error: any) {
      const errorMessage = errorHandler.handlePurchaseError(error);
      return { success: false, error: errorMessage };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();
      
      const customerInfo = await Purchases.restorePurchases();
      
      // Check if any entitlements are active
      const hasActiveEntitlements = Object.values(customerInfo.entitlements.active).length > 0;
      
      return { 
        success: hasActiveEntitlements,
        error: hasActiveEntitlements ? undefined : 'No purchases to restore'
      };
    } catch (error: any) {
      const errorMessage = errorHandler.handlePurchaseError(error);
      return { success: false, error: errorMessage };
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      await this.initialize();
      return await Purchases.getCustomerInfo();
    } catch (error) {
      errorHandler.handleApiError(error);
      return null;
    }
  }

  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo?.entitlements.active[entitlementId]?.isActive || false;
    } catch (error) {
      errorHandler.handleApiError(error);
      return false;
    }
  }

  // Premium entitlements
  async hasPremiumAccess(): Promise<boolean> {
    return await this.hasEntitlement('premium');
  }

  async hasUnlimitedGracePasses(): Promise<boolean> {
    return await this.hasEntitlement('unlimited_grace_passes');
  }

  async hasExtraBoosters(): Promise<boolean> {
    return await this.hasEntitlement('extra_boosters');
  }

  // Grace Pass purchases
  async purchaseGracePassPack(): Promise<{ success: boolean; error?: string }> {
    return await this.purchasePackage('grace_pass_pack_5');
  }

  async purchasePremiumBoosters(): Promise<{ success: boolean; error?: string }> {
    return await this.purchasePackage('premium_boosters');
  }

  async purchasePremiumSubscription(): Promise<{ success: boolean; error?: string }> {
    return await this.purchasePackage('premium_monthly');
  }

  private getEntitlementForPackage(packageId: string, customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
    // Map package IDs to entitlement IDs
    const packageToEntitlement: Record<string, string> = {
      'grace_pass_pack_5': 'grace_passes',
      'premium_boosters': 'extra_boosters',
      'premium_monthly': 'premium',
      'premium_yearly': 'premium',
    };

    const entitlementId = packageToEntitlement[packageId];
    return entitlementId ? customerInfo.entitlements.active[entitlementId] || null : null;
  }

  // Product definitions for RevenueCat dashboard
  static getProductDefinitions() {
    return {
      consumables: [
        {
          id: 'grace_pass_pack_5',
          name: 'Grace Pass Pack (5)',
          description: 'Restore broken streaks with God\'s grace',
          price: '$0.99',
        },
        {
          id: 'premium_boosters',
          name: 'Premium Booster Pack',
          description: 'Extra XP boosters for faster growth',
          price: '$2.99',
        },
        {
          id: 'support_mission_small',
          name: 'Support the Mission',
          description: 'Help us spread God\'s word',
          price: '$1.99',
        },
        {
          id: 'support_mission_medium',
          name: 'Support the Mission',
          description: 'Help us spread God\'s word',
          price: '$4.99',
        },
        {
          id: 'support_mission_large',
          name: 'Support the Mission',
          description: 'Help us spread God\'s word',
          price: '$9.99',
        },
      ],
      subscriptions: [
        {
          id: 'premium_monthly',
          name: 'Premium Monthly',
          description: 'Unlimited grace passes, extra boosters, ad-free',
          price: '$3.99/month',
        },
        {
          id: 'premium_yearly',
          name: 'Premium Yearly',
          description: 'Unlimited grace passes, extra boosters, ad-free',
          price: '$39.99/year',
        },
      ],
      entitlements: [
        {
          id: 'premium',
          name: 'Premium Access',
          products: ['premium_monthly', 'premium_yearly'],
        },
        {
          id: 'grace_passes',
          name: 'Grace Passes',
          products: ['grace_pass_pack_5'],
        },
        {
          id: 'extra_boosters',
          name: 'Extra Boosters',
          products: ['premium_boosters'],
        },
      ],
    };
  }
}

export const purchaseService = new PurchaseService();
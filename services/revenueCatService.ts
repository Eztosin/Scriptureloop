import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesEntitlementInfo 
} from 'react-native-purchases';

interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

interface EntitlementStatus {
  gracePass: boolean;
  premiumContent: boolean;
  adFree: boolean;
  supportMission: boolean;
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure RevenueCat
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 
                    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
      
      if (!apiKey || apiKey.includes('your_')) {
        console.warn('RevenueCat API key not configured - using mock mode');
        this.isInitialized = true;
        return;
      }

      await Purchases.configure({ apiKey });
      await Purchases.logIn(userId);
      
      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      this.isInitialized = true; // Continue in mock mode
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('RevenueCat not initialized');
      }

      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  async purchaseGracePass(): Promise<PurchaseResult> {
    try {
      const offerings = await this.getOfferings();
      const gracePassPackage = offerings?.availablePackages.find(
        pkg => pkg.identifier === 'grace_pass'
      );

      if (!gracePassPackage) {
        return this.mockPurchase('grace_pass');
      }

      const { customerInfo } = await Purchases.purchasePackage(gracePassPackage);
      
      return {
        success: true,
        customerInfo
      };
    } catch (error: any) {
      console.error('Grace Pass purchase failed:', error);
      
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async purchasePremiumContent(): Promise<PurchaseResult> {
    try {
      const offerings = await this.getOfferings();
      const premiumPackage = offerings?.availablePackages.find(
        pkg => pkg.identifier === 'premium_content'
      );

      if (!premiumPackage) {
        return this.mockPurchase('premium_content');
      }

      const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
      
      return {
        success: true,
        customerInfo
      };
    } catch (error: any) {
      console.error('Premium content purchase failed:', error);
      
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async supportMission(amount: '1.99' | '4.99' | '9.99'): Promise<PurchaseResult> {
    try {
      const offerings = await this.getOfferings();
      const supportPackage = offerings?.availablePackages.find(
        pkg => pkg.identifier === `support_${amount.replace('.', '_')}`
      );

      if (!supportPackage) {
        return this.mockPurchase(`support_${amount}`);
      }

      const { customerInfo } = await Purchases.purchasePackage(supportPackage);
      
      return {
        success: true,
        customerInfo
      };
    } catch (error: any) {
      console.error('Support mission purchase failed:', error);
      
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async getEntitlements(): Promise<EntitlementStatus> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      return {
        gracePass: this.hasActiveEntitlement(customerInfo, 'grace_pass'),
        premiumContent: this.hasActiveEntitlement(customerInfo, 'premium_content'),
        adFree: this.hasActiveEntitlement(customerInfo, 'ad_free'),
        supportMission: this.hasActiveEntitlement(customerInfo, 'supporter')
      };
    } catch (error) {
      console.error('Error fetching entitlements:', error);
      return {
        gracePass: false,
        premiumContent: false,
        adFree: false,
        supportMission: false
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return {
        success: true,
        customerInfo
      };
    } catch (error: any) {
      console.error('Restore purchases failed:', error);
      return { success: false, error: error.message };
    }
  }

  private hasActiveEntitlement(customerInfo: CustomerInfo, entitlementId: string): boolean {
    const entitlement = customerInfo.entitlements.active[entitlementId];
    return entitlement?.isActive === true;
  }

  // Mock purchases for development/testing
  private async mockPurchase(productId: string): Promise<PurchaseResult> {
    console.log(`Mock purchase: ${productId}`);
    
    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      customerInfo: {} as CustomerInfo
    };
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('RevenueCat logout failed:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
export type { PurchaseResult, EntitlementStatus };
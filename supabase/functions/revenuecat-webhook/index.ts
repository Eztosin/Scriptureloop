// REVENUECAT WEBHOOK HANDLER
// Supabase Edge Function that processes RevenueCat webhook events
// Handles in-app purchase notifications and grants entitlements
// Runs on Deno runtime with secure server-side access

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for cross-origin requests
// Required for webhook calls from RevenueCat servers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MAIN WEBHOOK HANDLER
// Processes HTTP requests from RevenueCat webhook system
serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // CREATE SUPABASE CLIENT WITH SERVICE ROLE
    // Service role bypasses RLS for server-side operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // PARSE WEBHOOK PAYLOAD
    const body = await req.json();
    const event = body.event;

    console.log('RevenueCat webhook received:', event.type);

    // WEBHOOK SIGNATURE VERIFICATION
    // Verify request is actually from RevenueCat (security measure)
    // TODO: Implement proper signature verification per RevenueCat docs
    const signature = req.headers.get('authorization');
    if (!signature) {
      return new Response('Unauthorized', { status: 401 });
    }

    // DISPATCH EVENT BY TYPE
    // RevenueCat sends different event types for different purchase states
    switch (event.type) {
      case 'INITIAL_PURCHASE':      // First time purchase
      case 'RENEWAL':               // Subscription renewal
      case 'NON_RENEWING_PURCHASE': // One-time purchase
        await handlePurchase(supabaseClient, event);
        break;
      case 'CANCELLATION':          // User cancelled subscription
      case 'EXPIRATION':            // Subscription expired
        await handleCancellation(supabaseClient, event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// HANDLE PURCHASE EVENTS
// Processes successful purchases and grants entitlements
async function handlePurchase(supabase: any, event: any) {
  // Extract purchase data from RevenueCat event
  const { app_user_id, product_id, price, currency, purchased_at, transaction_id } = event;
  
  // FIND USER IN DATABASE
  // app_user_id should match Supabase user UUID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('id', app_user_id)
    .single();

  // Validate user exists in our system
  if (!user) {
    console.error('User not found:', app_user_id);
    return;
  }

  // RECORD PURCHASE IN DATABASE
  // Create audit trail of all purchases for analytics and support
  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      user_id: app_user_id,
      revenuecat_transaction_id: transaction_id,  // Unique transaction ID
      product_id,                                 // What was purchased
      price_usd: price,                          // Price paid
      currency,                                  // Original currency
      purchase_date: purchased_at,               // When purchased
      webhook_data: event,                       // Full webhook payload
      entitlements_granted: getEntitlementsForProduct(product_id)  // What user gets
    });

  // Handle database errors (ignore duplicates for idempotency)
  if (purchaseError && purchaseError.code !== '23505') { // 23505 = unique constraint violation
    console.error('Purchase insert error:', purchaseError);
    return;
  }

  // GRANT ENTITLEMENTS TO USER
  // Give user what they purchased (gems, grace passes, etc.)
  await grantEntitlements(supabase, app_user_id, product_id);
}

// HANDLE CANCELLATION/EXPIRATION EVENTS
// Processes subscription cancellations and expirations
async function handleCancellation(supabase: any, event: any) {
  const { app_user_id, product_id } = event;
  
  // LOG CANCELLATION EVENT
  console.log('Handling cancellation for user:', app_user_id, 'product:', product_id);
  
  // TODO: IMPLEMENT CANCELLATION LOGIC
  // For subscriptions: remove premium features
  // For one-time purchases: usually no action needed
  // Implementation depends on your specific entitlement logic
}

// PRODUCT TO ENTITLEMENTS MAPPING
// Defines what entitlements each product grants
// This is the "catalog" of what users get for each purchase
function getEntitlementsForProduct(productId: string): string[] {
  const entitlements: Record<string, string[]> = {
    'grace_pass_single': ['grace_pass'],                    // Single grace pass
    'premium_content': ['premium_devotionals'],             // Access to premium devotionals
    'support_mission_small': ['supporter_badge'],           // Supporter badge only
    'support_mission_medium': ['supporter_badge', 'bonus_gems'],  // Badge + gems
    'support_mission_large': ['supporter_badge', 'bonus_gems', 'premium_devotionals'],  // Everything
    'ad_free_monthly': ['ad_free']                          // Remove ads
  };
  
  return entitlements[productId] || [];  // Return empty array if product not found
}

// GRANT ENTITLEMENTS TO USER
// Actually gives the user what they purchased by updating their account
async function grantEntitlements(supabase: any, userId: string, productId: string) {
  switch (productId) {
    case 'grace_pass_single':
      // GRANT SINGLE GRACE PASS
      // Add 1 to user's available grace passes
      await supabase
        .from('users')
        .update({ 
          grace_passes_available: supabase.raw('grace_passes_available + 1')
        })
        .eq('id', userId);
      break;
      
    case 'support_mission_small':
      // GRANT SMALL SUPPORT PACKAGE
      // Give user 100 bonus gems
      await supabase
        .from('users')
        .update({ 
          gems: supabase.raw('gems + 100')
        })
        .eq('id', userId);
      break;
      
    case 'support_mission_medium':
      // GRANT MEDIUM SUPPORT PACKAGE
      // Give user 250 bonus gems
      await supabase
        .from('users')
        .update({ 
          gems: supabase.raw('gems + 250')
        })
        .eq('id', userId);
      break;
      
    case 'support_mission_large':
      // GRANT LARGE SUPPORT PACKAGE
      // Give user 500 gems + 3 grace passes (premium package)
      await supabase
        .from('users')
        .update({ 
          gems: supabase.raw('gems + 500'),
          grace_passes_available: supabase.raw('grace_passes_available + 3')
        })
        .eq('id', userId);
      break;
      
    default:
      // UNKNOWN PRODUCT
      // Log warning but don't fail - might be a new product not yet implemented
      console.log('No entitlements to grant for product:', productId);
  }
}
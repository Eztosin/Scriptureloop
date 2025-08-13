// WEEKLY LEAGUE UPDATE EDGE FUNCTION
// Supabase Edge Function for manual triggering of weekly league updates
// Can be called via HTTP or scheduled externally
// Provides alternative to pg_cron for league management

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MAIN FUNCTION HANDLER
// Processes HTTP requests to trigger league updates
serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // CREATE SUPABASE CLIENT WITH SERVICE ROLE
    // Service role required to call RPC functions that modify user data
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // CALL THE WEEKLY LEAGUE UPDATE RPC FUNCTION
    // This function handles all league promotion/relegation logic
    const { data, error } = await supabaseClient.rpc('run_weekly_league_update');

    // HANDLE RPC ERRORS
    if (error) {
      console.error('League update error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // LOG SUCCESS AND RETURN RESULTS
    console.log('Weekly league update completed:', data);

    // Return success response with league update results
    return new Response(JSON.stringify({
      success: true,
      message: 'Weekly league update completed',
      data  // Contains user rankings, promotions, relegations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // HANDLE UNEXPECTED ERRORS
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// USAGE NOTES:
// 1. Can be called manually via HTTP POST to test league updates
// 2. Can be scheduled using external cron services (GitHub Actions, etc.)
// 3. Provides backup method if pg_cron is not available
// 4. Returns detailed results for monitoring and debugging
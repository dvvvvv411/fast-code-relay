
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Test function triggered');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_REMINDER_BOT_TOKEN');
    const telegramChatIds = Deno.env.get('TELEGRAM_REMINDER_CHAT_ID');

    // Test 1: Check environment variables
    console.log('🔍 Testing environment variables...');
    const envTest = {
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
      TELEGRAM_REMINDER_BOT_TOKEN: !!telegramBotToken,
      TELEGRAM_REMINDER_CHAT_ID: !!telegramChatIds,
    };
    console.log('Environment variables:', envTest);

    if (!telegramBotToken || !telegramChatIds) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Telegram credentials',
          envTest,
          availableEnvVars: Object.keys(Deno.env.toObject())
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chatIdArray = telegramChatIds.split(',').map(id => id.trim()).filter(id => id.length > 0);

    // Test 2: Test Telegram connection
    console.log('📱 Testing Telegram connection...');
    const testMessage = `🧪 Test message from appointment reminder system\n` +
      `📅 Time: ${new Date().toLocaleString('de-DE')}\n` +
      `🤖 This is a test to verify the bot is working correctly.`;

    let telegramTest = { success: false, chatResults: [] as any[] };

    for (const chatId of chatIdArray) {
      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: testMessage,
          }),
        });

        const responseData = await telegramResponse.json();
        
        if (telegramResponse.ok) {
          console.log(`✅ Test message sent to chat ID: ${chatId}`);
          telegramTest.chatResults.push({ chatId, success: true, messageId: responseData.result?.message_id });
          telegramTest.success = true;
        } else {
          console.error(`❌ Failed to send test message to chat ID ${chatId}:`, responseData);
          telegramTest.chatResults.push({ chatId, success: false, error: responseData });
        }
      } catch (error) {
        console.error(`❌ Error sending test message to chat ID ${chatId}:`, error);
        telegramTest.chatResults.push({ chatId, success: false, error: error.message });
      }
    }

    // Test 3: Test database connection
    console.log('🗄️ Testing database connection...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let dbTest = { success: false, appointmentCount: 0, error: null };
    try {
      const { data: appointments, error: dbError } = await supabase
        .from('appointments')
        .select('id, status, appointment_date, appointment_time')
        .eq('status', 'confirmed')
        .limit(5);

      if (dbError) {
        dbTest.error = dbError.message;
      } else {
        dbTest.success = true;
        dbTest.appointmentCount = appointments?.length || 0;
        console.log(`✅ Database connection successful. Found ${dbTest.appointmentCount} confirmed appointments`);
      }
    } catch (error) {
      dbTest.error = error.message;
      console.error('❌ Database connection failed:', error);
    }

    // Test 4: Test the actual reminder function
    console.log('⚡ Testing reminder function...');
    let reminderFunctionTest = { success: false, response: null, error: null };
    
    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: { test: true }
      });

      if (error) {
        reminderFunctionTest.error = error.message;
      } else {
        reminderFunctionTest.success = true;
        reminderFunctionTest.response = data;
        console.log('✅ Reminder function test completed');
      }
    } catch (error) {
      reminderFunctionTest.error = error.message;
      console.error('❌ Reminder function test failed:', error);
    }

    const results = {
      timestamp: new Date().toISOString(),
      germanTime: new Date().toLocaleString('de-DE'),
      tests: {
        environment: envTest,
        telegram: telegramTest,
        database: dbTest,
        reminderFunction: reminderFunctionTest
      },
      summary: {
        allTestsPassed: envTest.TELEGRAM_REMINDER_BOT_TOKEN && 
                       envTest.TELEGRAM_REMINDER_CHAT_ID && 
                       telegramTest.success && 
                       dbTest.success,
        chatIdsConfigured: chatIdArray.length,
        telegramWorking: telegramTest.success,
        databaseWorking: dbTest.success
      }
    };

    console.log('🎉 Test completed:', results.summary);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in test function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

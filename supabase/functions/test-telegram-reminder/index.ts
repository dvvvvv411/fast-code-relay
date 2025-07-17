
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('🧪 Test Telegram reminder function triggered');
    
    const telegramBotToken = Deno.env.get('TELEGRAM_REMINDER_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!telegramBotToken) {
      console.error('Missing Telegram bot token for reminders');
      return new Response(
        JSON.stringify({ error: 'Missing Telegram bot token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.8');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active chat IDs from database
    console.log('📱 Fetching active Telegram chat IDs from database...');
    const { data: chatData, error: chatError } = await supabase
      .from('telegram_chat_ids')
      .select('chat_id, name')
      .eq('is_active', true);

    if (chatError) {
      console.error('Error fetching chat IDs:', chatError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chat IDs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chatData || chatData.length === 0) {
      console.log('📱 No active chat IDs found in database');
      return new Response(
        JSON.stringify({ error: 'No active chat IDs configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chatIdArray = chatData.map(chat => chat.chat_id);
    console.log(`📱 Found ${chatIdArray.length} active chat IDs:`, chatData.map(chat => `${chat.name} (${chat.chat_id})`));

    if (chatIdArray.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid chat IDs found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const testMessage = `🧪 Test-Nachricht vom Terminerinnerungs-Bot\n\n` +
      `✅ Bot ist korrekt konfiguriert und kann Nachrichten senden.\n` +
      `🕐 Gesendet um: ${new Date().toLocaleString('de-DE')}\n\n` +
      `Dieser Bot wird Terminerinnerungen 30 Minuten vor Terminen senden.`;

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Send test message to all chat IDs
    for (const chatId of chatIdArray) {
      try {
        console.log(`📤 Sending test message to chat ID: ${chatId}`);

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

        if (telegramResponse.ok) {
          console.log(`✅ Test message sent successfully to chat ID: ${chatId}`);
          successCount++;
          results.push({ chatId, status: 'success' });
        } else {
          const errorText = await telegramResponse.text();
          console.error(`❌ Failed to send to chat ID ${chatId}:`, errorText);
          errorCount++;
          results.push({ chatId, status: 'error', error: errorText });
        }
      } catch (error) {
        console.error(`❌ Error sending to chat ID ${chatId}:`, error);
        errorCount++;
        results.push({ chatId, status: 'error', error: error.message });
      }
    }

    console.log(`🎉 Test completed: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalChatIds: chatIdArray.length,
        successCount,
        errorCount,
        results,
        message: `Test messages sent to ${successCount}/${chatIdArray.length} chat IDs`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-telegram-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

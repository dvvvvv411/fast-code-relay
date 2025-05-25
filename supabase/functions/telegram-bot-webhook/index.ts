
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
    };
    text?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    
    console.log('Received Telegram webhook:', JSON.stringify(update, null, 2));
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const adminChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!botToken || !adminChatId || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response('Missing environment variables', { status: 500 });
    }

    // Check if this is a message from the admin
    const message = update.message;
    if (!message || !message.text || message.chat.id.toString() !== adminChatId) {
      console.log('Message not from admin or no text, ignoring');
      return new Response('OK', { status: 200 });
    }

    const text = message.text.trim();
    console.log('Processing command:', text);

    // Check if it's an activate command
    if (text.startsWith('/activate ')) {
      const phoneNumber = text.replace('/activate ', '').trim();
      console.log('Attempting to activate phone number:', phoneNumber);

      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      try {
        // Find the phone number record
        const { data: phoneData, error: phoneError } = await supabase
          .from('phone_numbers')
          .select('id')
          .eq('phone', phoneNumber)
          .single();

        if (phoneError || !phoneData) {
          console.error('Phone number not found:', phoneNumber, phoneError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Telefonnummer ${phoneNumber} nicht gefunden.`);
          return new Response('OK', { status: 200 });
        }

        // Find pending request for this phone number
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select('id, status')
          .eq('phone_number_id', phoneData.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (requestError || !requestData) {
          console.error('No pending request found for phone number:', phoneNumber, requestError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Keine offene Anfrage für ${phoneNumber} gefunden.`);
          return new Response('OK', { status: 200 });
        }

        // Activate the request
        const { error: updateError } = await supabase
          .from('requests')
          .update({ status: 'activated' })
          .eq('id', requestData.id);

        if (updateError) {
          console.error('Error activating request:', updateError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Aktivieren von ${phoneNumber}.`);
          return new Response('OK', { status: 200 });
        }

        console.log('Successfully activated request:', requestData.id);
        
        // Send confirmation message
        await sendTelegramMessage(botToken, adminChatId, `✅ Nummer ${phoneNumber} wurde erfolgreich aktiviert!`);

        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing activate command:', error);
        await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Verarbeiten des Befehls für ${phoneNumber}.`);
        return new Response('OK', { status: 200 });
      }
    }

    // Handle unknown commands
    if (text.startsWith('/')) {
      console.log('Unknown command:', text);
      await sendTelegramMessage(
        botToken, 
        adminChatId, 
        `❓ Unbekannter Befehl: ${text}\n\nVerfügbare Befehle:\n/activate <telefonnummer> - Nummer aktivieren`
      );
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in telegram-bot-webhook function:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// Helper function to send messages to Telegram
async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Telegram message:', errorText);
    } else {
      console.log('Telegram message sent successfully');
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}


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
    
    console.log('Received appointment bot webhook:', JSON.stringify(update, null, 2));
    
    const botToken = Deno.env.get('TELEGRAM_REMINDER_BOT_TOKEN');
    const adminChatIds = Deno.env.get('TELEGRAM_REMINDER_CHAT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!botToken || !adminChatIds || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response('Missing environment variables', { status: 500 });
    }

    // Parse chat IDs (comma-separated) and validate
    const chatIdArray = adminChatIds.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0 && /^\d+$/.test(id));

    // Check if this is a message from an authorized admin
    const message = update.message;
    if (!message || !message.text) {
      console.log('No message or text, ignoring');
      return new Response('OK', { status: 200 });
    }

    const isAuthorizedAdmin = chatIdArray.includes(message.chat.id.toString());
    if (!isAuthorizedAdmin) {
      console.log('Message not from authorized admin, ignoring');
      return new Response('OK', { status: 200 });
    }

    const text = message.text.trim();
    console.log('Processing command:', text);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if it's the termine command
    if (text === '/termine') {
      console.log('Processing /termine command');

      try {
        // Get current date in Germany timezone
        const now = new Date();
        const germanTime = new Intl.DateTimeFormat('de-DE', {
          timeZone: 'Europe/Berlin',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(now);
        
        // Convert to YYYY-MM-DD format for database query
        const [day, month, year] = germanTime.split('.');
        const todayDate = `${year}-${month}-${day}`;
        
        console.log('Querying appointments for date:', todayDate);

        // Query appointments for today with recipient information
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select(`
            appointment_time,
            appointment_recipients!inner(first_name, last_name, phone_note)
          `)
          .eq('appointment_date', todayDate)
          .eq('status', 'confirmed')
          .order('appointment_time', { ascending: true });

        if (error) {
          console.error('Error fetching appointments:', error);
          await sendTelegramMessage(botToken, message.chat.id.toString(), `❌ Fehler beim Laden der Termine: ${error.message}`);
          return new Response('OK', { status: 200 });
        }

        console.log(`Found ${appointments?.length || 0} appointments for today`);

        // Format the response
        let responseText = `📅 **Termine für heute (${germanTime})**\n\n`;

        if (!appointments || appointments.length === 0) {
          responseText += '🎉 Keine Termine für heute geplant!';
        } else {
          responseText += '```\n';
          responseText += '┌──────────┬─────────────────────┬──────────────────┐\n';
          responseText += '│   Zeit   │        Name         │     Telefon      │\n';
          responseText += '├──────────┼─────────────────────┼──────────────────┤\n';

          appointments.forEach((appointment) => {
            const time = appointment.appointment_time.substring(0, 5); // HH:MM format
            const fullName = `${appointment.appointment_recipients.first_name} ${appointment.appointment_recipients.last_name}`;
            const phone = appointment.appointment_recipients.phone_note || 'Nicht verfügbar';
            
            // Pad strings to fit table columns
            const paddedTime = time.padEnd(8);
            const paddedName = fullName.length > 19 ? fullName.substring(0, 16) + '...' : fullName.padEnd(19);
            const paddedPhone = phone.length > 16 ? phone.substring(0, 13) + '...' : phone.padEnd(16);
            
            responseText += `│ ${paddedTime} │ ${paddedName} │ ${paddedPhone} │\n`;
          });

          responseText += '└──────────┴─────────────────────┴──────────────────┘\n';
          responseText += '```\n\n';
          responseText += `📊 **Gesamt: ${appointments.length} Termine**`;
        }

        await sendTelegramMessage(botToken, message.chat.id.toString(), responseText);
        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing /termine command:', error);
        await sendTelegramMessage(botToken, message.chat.id.toString(), `❌ Fehler beim Verarbeiten des /termine Befehls.`);
        return new Response('OK', { status: 200 });
      }
    }

    // Handle unknown commands
    if (text.startsWith('/')) {
      console.log('Unknown command:', text);
      await sendTelegramMessage(
        botToken, 
        message.chat.id.toString(), 
        `❓ Unbekannter Befehl: ${text}\n\nVerfügbare Befehle:\n/termine - Heutige Termine anzeigen`
      );
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in appointment-bot-webhook function:', error);
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
        parse_mode: 'Markdown',
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

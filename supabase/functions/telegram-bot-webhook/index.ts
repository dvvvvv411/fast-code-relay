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
          await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Laden der Termine: ${error.message}`);
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

        await sendTelegramMessage(botToken, adminChatId, responseText);
        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing /termine command:', error);
        await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Verarbeiten des /termine Befehls.`);
        return new Response('OK', { status: 200 });
      }
    }

    // Check if it's an activate command with short ID
    if (text.startsWith('/activate ')) {
      const shortId = text.replace('/activate ', '').trim().toUpperCase();
      console.log('Attempting to activate request with short ID:', shortId);

      try {
        // Find the request by short_id
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select(`
            id, 
            status, 
            phone_number_id,
            phone_numbers!inner(phone, access_code)
          `)
          .eq('short_id', shortId)
          .eq('status', 'pending')
          .single();

        if (requestError || !requestData) {
          console.error('Request not found or not pending for short ID:', shortId, requestError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Keine offene Anfrage für ID ${shortId} gefunden.`);
          return new Response('OK', { status: 200 });
        }

        // Activate the request
        const { error: updateError } = await supabase
          .from('requests')
          .update({ status: 'activated' })
          .eq('id', requestData.id);

        if (updateError) {
          console.error('Error activating request:', updateError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Aktivieren von ID ${shortId}.`);
          return new Response('OK', { status: 200 });
        }

        console.log('Successfully activated request:', requestData.id);
        
        // Send confirmation message with phone number
        const phoneNumber = requestData.phone_numbers.phone;
        await sendTelegramMessage(
          botToken, 
          adminChatId, 
          `✅ ID ${shortId} wurde erfolgreich aktiviert!\n📱 Nummer: ${phoneNumber}`
        );

        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing activate command:', error);
        await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Verarbeiten des Befehls für ID ${shortId}.`);
        return new Response('OK', { status: 200 });
      }
    }

    // Check if it's a send SMS code command with format /send ID CODE
    if (text.startsWith('/send ')) {
      const commandParts = text.split(' ');
      
      if (commandParts.length !== 3) {
        console.log('Invalid send command format:', text);
        await sendTelegramMessage(
          botToken, 
          adminChatId, 
          `❌ Falsches Format!\n\nKorrekte Verwendung:\n/send [ID] [SMS-Code]\n\nBeispiel: /send ABC123 123456`
        );
        return new Response('OK', { status: 200 });
      }

      const shortId = commandParts[1].trim().toUpperCase();
      const smsCode = commandParts[2].trim();
      
      console.log('Attempting to send SMS code for short ID:', shortId, 'Code:', smsCode);

      try {
        // Find the request by short_id
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select(`
            id, 
            status, 
            phone_number_id,
            phone_numbers!inner(phone, access_code)
          `)
          .eq('short_id', shortId)
          .in('status', ['activated', 'sms_requested', 'sms_sent', 'waiting_for_additional_sms'])
          .single();

        if (requestError || !requestData) {
          console.error('Request not found or invalid status for short ID:', shortId, requestError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Keine passende Anfrage für ID ${shortId} gefunden oder falscher Status.`);
          return new Response('OK', { status: 200 });
        }

        // Update the request with SMS code and status
        const { error: updateError } = await supabase
          .from('requests')
          .update({ 
            status: 'waiting_for_additional_sms',
            sms_code: smsCode
          })
          .eq('id', requestData.id);

        if (updateError) {
          console.error('Error updating request with SMS code:', updateError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Senden des SMS-Codes für ID ${shortId}.`);
          return new Response('OK', { status: 200 });
        }

        console.log('Successfully sent SMS code for request:', requestData.id);
        
        // Send confirmation message with phone number and SMS code
        const phoneNumber = requestData.phone_numbers.phone;
        await sendTelegramMessage(
          botToken, 
          adminChatId, 
          `✅ SMS Code ${smsCode} für ID ${shortId} wurde erfolgreich gesendet!\n📱 Nummer: ${phoneNumber}\n📨 Code: ${smsCode}\n⏳ Nutzer kann jetzt den Code sehen`
        );

        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing send SMS command:', error);
        await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Verarbeiten des SMS-Befehls für ID ${shortId}.`);
        return new Response('OK', { status: 200 });
      }
    }

    // Check if it's a complete command with format /complete ID
    if (text.startsWith('/complete ')) {
      const shortId = text.replace('/complete ', '').trim().toUpperCase();
      console.log('Attempting to complete request with short ID:', shortId);

      try {
        // Find the request by short_id
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select(`
            id, 
            status, 
            phone_number_id,
            phone_numbers!inner(phone, access_code)
          `)
          .eq('short_id', shortId)
          .in('status', ['activated', 'sms_requested', 'sms_sent', 'waiting_for_additional_sms'])
          .single();

        if (requestError || !requestData) {
          console.error('Request not found or invalid status for short ID:', shortId, requestError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Keine passende Anfrage für ID ${shortId} gefunden oder falscher Status.`);
          return new Response('OK', { status: 200 });
        }

        // Complete the request
        const { error: updateError } = await supabase
          .from('requests')
          .update({ status: 'completed' })
          .eq('id', requestData.id);

        if (updateError) {
          console.error('Error completing request:', updateError);
          await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Abschließen von ID ${shortId}.`);
          return new Response('OK', { status: 200 });
        }

        console.log('Successfully completed request:', requestData.id);
        
        // Send confirmation message
        const phoneNumber = requestData.phone_numbers.phone;
        await sendTelegramMessage(
          botToken, 
          adminChatId, 
          `✅ Auftrag ${shortId} wurde als abgeschlossen markiert!\n📱 Nummer: ${phoneNumber}`
        );

        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing complete command:', error);
        await sendTelegramMessage(botToken, adminChatId, `❌ Fehler beim Verarbeiten des Complete-Befehls für ID ${shortId}.`);
        return new Response('OK', { status: 200 });
      }
    }

    // Handle unknown commands
    if (text.startsWith('/')) {
      console.log('Unknown command:', text);
      await sendTelegramMessage(
        botToken, 
        adminChatId, 
        `❓ Unbekannter Befehl: ${text}\n\nVerfügbare Befehle:\n/activate [ID] - Nummer über kurze ID aktivieren (z.B. /activate ABC123)\n/send [ID] [Code] - SMS Code senden (z.B. /send ABC123 123456)\n/complete [ID] - Auftrag abschließen (z.B. /complete ABC123)\n/termine - Heutige Termine anzeigen`
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

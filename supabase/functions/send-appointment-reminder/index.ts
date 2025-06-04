
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentWithRecipient {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  recipient: {
    first_name: string;
    last_name: string;
    email: string;
    phone_note?: string;
  };
}

// Helper function to convert UTC to German time
function convertToGermanTime(date: Date): Date {
  // Germany is UTC+1 (CET) or UTC+2 (CEST)
  // This is a simplified approach - for production use a proper timezone library
  const germanOffset = date.getMonth() >= 2 && date.getMonth() <= 9 ? 2 : 1; // Rough DST calculation
  return new Date(date.getTime() + (germanOffset * 60 * 60 * 1000));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    console.log('🔔 Appointment reminder function triggered at:', new Date().toISOString());
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_REMINDER_BOT_TOKEN');
    const telegramChatIds = Deno.env.get('TELEGRAM_REMINDER_CHAT_ID');
    
    if (!telegramBotToken || !telegramChatIds) {
      console.error('❌ Missing Telegram credentials for reminders');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ error: 'Missing Telegram credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse chat IDs (comma-separated) and validate
    const chatIdArray = telegramChatIds.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0 && /^\d+$/.test(id));
    
    console.log(`📱 Configured chat IDs: ${JSON.stringify(chatIdArray)}`);
    
    if (chatIdArray.length === 0) {
      console.error('❌ No valid chat IDs configured');
      return new Response(
        JSON.stringify({ error: 'No valid chat IDs configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in German timezone
    const nowUTC = new Date();
    const nowGerman = convertToGermanTime(nowUTC);
    
    // OPTIMIZED TIMING: Look for appointments 28-32 minutes from now (tighter window)
    const reminderStartTime = new Date(nowGerman.getTime() + 28 * 60 * 1000);
    const reminderEndTime = new Date(nowGerman.getTime() + 32 * 60 * 1000);
    
    console.log(`⏰ Current German time: ${nowGerman.toLocaleString('de-DE')}`);
    console.log(`🕐 Reminder window: ${reminderStartTime.toLocaleString('de-DE')} - ${reminderEndTime.toLocaleString('de-DE')}`);

    // Find appointments that are confirmed and within the reminder window
    const targetDate = reminderStartTime.toISOString().split('T')[0];
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        recipient:appointment_recipients(
          first_name,
          last_name,
          email,
          phone_note
        )
      `)
      .eq('status', 'confirmed')
      .eq('appointment_date', targetDate);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log(`📅 Found ${appointments?.length || 0} confirmed appointments for date ${targetDate}`);

    if (!appointments || appointments.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`ℹ️  No confirmed appointments found for today (${duration}ms)`);
      return new Response(
        JSON.stringify({ 
          message: 'No confirmed appointments found for today', 
          germanTime: nowGerman.toLocaleString('de-DE'),
          duration: `${duration}ms`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let remindersSent = 0;
    let appointmentsChecked = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    for (const appointment of appointments as AppointmentWithRecipient[]) {
      try {
        appointmentsChecked++;
        
        // Create appointment datetime in German timezone
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        
        console.log(`📋 Checking appointment ${appointment.id}: ${appointmentDateTime.toLocaleString('de-DE')}`);
        
        // Check if appointment is within reminder window
        const isInReminderWindow = appointmentDateTime >= reminderStartTime && appointmentDateTime <= reminderEndTime;
        
        if (!isInReminderWindow) {
          const timeDiff = (appointmentDateTime.getTime() - nowGerman.getTime()) / (1000 * 60);
          console.log(`   ⏭️  Outside reminder window (${Math.round(timeDiff)} minutes away)`);
          continue;
        }

        // IMPROVED DUPLICATE PREVENTION: Check if reminder was already sent with a grace period
        const { data: existingReminder, error: reminderCheckError } = await supabase
          .from('appointment_reminders')
          .select('id, reminder_sent_at')
          .eq('appointment_id', appointment.id)
          .maybeSingle();

        if (reminderCheckError) {
          console.error(`❌ Error checking existing reminder for ${appointment.id}:`, reminderCheckError);
          errors++;
          continue;
        }

        if (existingReminder) {
          duplicatesSkipped++;
          const sentAt = new Date(existingReminder.reminder_sent_at);
          console.log(`   ✅ Reminder already sent for appointment ${appointment.id} at ${sentAt.toLocaleString('de-DE')}`);
          continue;
        }

        const recipient = appointment.recipient;
        const timeDiff = Math.round((appointmentDateTime.getTime() - nowGerman.getTime()) / (1000 * 60));
        
        // Format the reminder message in German
        const message = `🚨 TERMINERINNERUNG!\n\n` +
          `👤 Name: ${recipient.first_name} ${recipient.last_name}\n` +
          `📧 E-Mail: ${recipient.email}\n` +
          `📱 Telefon: ${recipient.phone_note || 'Nicht angegeben'}\n` +
          `🕐 Termin: ${appointmentDateTime.toLocaleString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}\n\n` +
          `⏰ Der Termin beginnt in ca. ${timeDiff} Minuten!\n` +
          `🎯 Appointment ID: ${appointment.id}`;

        console.log(`📤 Sending reminder for appointment ${appointment.id} to ${chatIdArray.length} chat(s)`);

        let messageSentSuccessfully = false;
        const chatResults = [];

        // Send message to all configured chat IDs
        for (const chatId of chatIdArray) {
          try {
            console.log(`   📱 Sending to chat ID: ${chatId}`);
            
            const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
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

            const responseData = await telegramResponse.json();

            if (telegramResponse.ok) {
              console.log(`   ✅ Reminder sent successfully to chat ID: ${chatId} (message_id: ${responseData.result?.message_id})`);
              messageSentSuccessfully = true;
              chatResults.push({ chatId, success: true, messageId: responseData.result?.message_id });
            } else {
              console.error(`   ❌ Failed to send to chat ID ${chatId}:`, responseData);
              chatResults.push({ chatId, success: false, error: responseData });
              errors++;
            }
          } catch (error) {
            console.error(`   ❌ Error sending to chat ID ${chatId}:`, error);
            chatResults.push({ chatId, success: false, error: error.message });
            errors++;
          }
        }

        // Record reminder as sent only if at least one message was sent successfully
        if (messageSentSuccessfully) {
          const { error: reminderError } = await supabase
            .from('appointment_reminders')
            .insert({
              appointment_id: appointment.id,
            });

          if (reminderError) {
            console.error(`❌ Error recording reminder for ${appointment.id}:`, reminderError);
            errors++;
          } else {
            console.log(`   ✅ Reminder recorded in database for appointment ${appointment.id}`);
          }

          remindersSent++;
        } else {
          console.error(`   ❌ Failed to send reminder for appointment ${appointment.id} to any chat`);
          errors++;
        }
      } catch (error) {
        console.error(`❌ Error processing appointment ${appointment.id}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      germanTime: nowGerman.toLocaleString('de-DE'),
      appointmentsChecked,
      remindersSent,
      duplicatesSkipped,
      errors,
      chatIds: chatIdArray.length,
      duration: `${duration}ms`,
      message: `Checked ${appointmentsChecked} appointments, sent ${remindersSent} reminders, skipped ${duplicatesSkipped} duplicates, ${errors} errors`
    };

    console.log(`🎉 Function completed:`, summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - Date.now();
    console.error('💥 Error in send-appointment-reminder function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        germanTime: convertToGermanTime(new Date()).toLocaleString('de-DE'),
        duration: `${duration}ms`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

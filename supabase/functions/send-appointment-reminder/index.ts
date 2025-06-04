
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

// Convert UTC time to German time (handles both CET and CEST)
function convertToGermanTime(utcDate: Date): Date {
  const germanTime = new Date(utcDate.toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
  return germanTime;
}

// Format time for German locale
function formatGermanDateTime(date: Date): string {
  return date.toLocaleString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin'
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Appointment reminder function triggered at:', new Date().toISOString());
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_REMINDER_BOT_TOKEN');
    const telegramChatIds = Deno.env.get('TELEGRAM_REMINDER_CHAT_ID');
    
    console.log('🔧 Environment check:');
    console.log('- Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('- Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
    console.log('- Telegram Bot Token:', telegramBotToken ? 'Set' : 'Missing');
    console.log('- Telegram Chat IDs:', telegramChatIds ? 'Set' : 'Missing');
    
    if (!telegramBotToken || !telegramChatIds) {
      console.error('❌ Missing Telegram credentials for reminders');
      return new Response(
        JSON.stringify({ error: 'Missing Telegram credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse chat IDs (comma-separated)
    const chatIdArray = telegramChatIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
    console.log(`📱 Configured chat IDs (${chatIdArray.length}):`, chatIdArray);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in German timezone
    const nowUtc = new Date();
    const nowGerman = convertToGermanTime(nowUtc);
    
    // Calculate 30 minutes from now in German time
    const reminderTimeGerman = new Date(nowGerman.getTime() + 30 * 60 * 1000);
    
    console.log('⏰ Time check:');
    console.log('- UTC now:', nowUtc.toISOString());
    console.log('- German now:', nowGerman.toLocaleString('de-DE', {timeZone: 'Europe/Berlin'}));
    console.log('- German reminder time:', reminderTimeGerman.toLocaleString('de-DE', {timeZone: 'Europe/Berlin'}));
    
    // Format for database query (use German date)
    const reminderDate = reminderTimeGerman.toISOString().split('T')[0];
    const reminderTime = reminderTimeGerman.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    console.log('🔍 Searching for appointments:');
    console.log('- Date:', reminderDate);
    console.log('- Time:', reminderTime);

    // Find appointments that are 30 minutes away and haven't had reminders sent yet
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
      .eq('appointment_date', reminderDate)
      .not('id', 'in', `(
        SELECT appointment_id 
        FROM appointment_reminders
      )`);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log(`📅 Found ${appointments?.length || 0} appointments to check`);

    if (!appointments || appointments.length === 0) {
      console.log('ℹ️ No appointments need reminders at this time');
      return new Response(
        JSON.stringify({ message: 'No appointments need reminders at this time', checkedTime: nowGerman.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let remindersSent = 0;
    const processedAppointments = [];

    for (const appointment of appointments as AppointmentWithRecipient[]) {
      try {
        // Parse appointment time and convert to German timezone for comparison
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}:00`);
        const appointmentGerman = convertToGermanTime(appointmentDateTime);
        
        // Calculate time difference in minutes
        const timeDiff = appointmentGerman.getTime() - nowGerman.getTime();
        const minutesDiff = Math.round(timeDiff / (1000 * 60));

        console.log(`📊 Appointment ${appointment.id}:`);
        console.log(`   - Scheduled: ${appointmentGerman.toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})}`);
        console.log(`   - Minutes away: ${minutesDiff}`);

        // Send reminder if appointment is between 25-35 minutes away (to account for cron timing variations)
        if (minutesDiff >= 25 && minutesDiff <= 35) {
          const recipient = appointment.recipient;
          
          // Format the reminder message
          const message = `🔔 Terminerinnerung!\n\n` +
            `👤 Name: ${recipient.first_name} ${recipient.last_name}\n` +
            `📧 E-Mail: ${recipient.email}\n` +
            `📱 Telefon: ${recipient.phone_note || 'Nicht angegeben'}\n` +
            `🕐 Termin: ${formatGermanDateTime(appointmentGerman)}\n\n` +
            `⏰ Der Termin beginnt in ca. ${minutesDiff} Minuten!`;

          console.log(`📤 Sending reminder for appointment ${appointment.id} to ${chatIdArray.length} chat(s)`);

          let messageSentSuccessfully = false;

          // Send message to all configured chat IDs
          for (const chatId of chatIdArray) {
            try {
              const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: message,
                  parse_mode: 'HTML'
                }),
              });

              if (telegramResponse.ok) {
                console.log(`✅ Reminder sent successfully to chat ID: ${chatId}`);
                messageSentSuccessfully = true;
              } else {
                const errorText = await telegramResponse.text();
                console.error(`❌ Failed to send to chat ID ${chatId}:`, errorText);
              }
            } catch (error) {
              console.error(`❌ Error sending to chat ID ${chatId}:`, error);
            }
          }

          // Mark reminder as sent if at least one message was sent successfully
          if (messageSentSuccessfully) {
            const { error: reminderError } = await supabase
              .from('appointment_reminders')
              .insert({
                appointment_id: appointment.id,
              });

            if (reminderError) {
              console.error('❌ Error recording reminder:', reminderError);
              // Continue anyway since the message was sent
            } else {
              console.log(`✅ Reminder recorded in database for appointment ${appointment.id}`);
            }

            remindersSent++;
            processedAppointments.push({
              appointmentId: appointment.id,
              status: 'sent',
              minutesAway: minutesDiff
            });
          } else {
            console.error(`❌ Failed to send reminder for appointment ${appointment.id} to any chat`);
            processedAppointments.push({
              appointmentId: appointment.id,
              status: 'failed',
              minutesAway: minutesDiff
            });
          }
        } else {
          console.log(`⏭️ Appointment ${appointment.id} is ${minutesDiff} minutes away, not in reminder window (25-35 minutes)`);
          processedAppointments.push({
            appointmentId: appointment.id,
            status: 'not_in_window',
            minutesAway: minutesDiff
          });
        }
      } catch (error) {
        console.error(`❌ Error processing appointment ${appointment.id}:`, error);
        processedAppointments.push({
          appointmentId: appointment.id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`🎉 Reminder check completed: ${remindersSent} reminders sent out of ${appointments.length} appointments checked`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        totalChecked: appointments.length,
        chatIds: chatIdArray.length,
        germanTime: nowGerman.toISOString(),
        processedAppointments,
        message: `Sent ${remindersSent} appointment reminders to ${chatIdArray.length} chat(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-appointment-reminder function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        function: 'send-appointment-reminder'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

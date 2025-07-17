
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Appointment reminder function triggered');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_REMINDER_BOT_TOKEN');
    
    if (!telegramBotToken) {
      console.error('Missing Telegram bot token for reminders');
      return new Response(
        JSON.stringify({ error: 'Missing Telegram bot token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log(`📱 Configured chat IDs:`, chatIds.map(c => `${c.name} (${c.chat_id})`));


    // Calculate the time 30 minutes from now
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    
    console.log('⏰ Checking for appointments at:', reminderTime.toISOString());

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
      .eq('appointment_date', reminderTime.toISOString().split('T')[0])
      .not('id', 'in', `(
        SELECT appointment_id 
        FROM appointment_reminders
      )`);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log(`📅 Found ${appointments?.length || 0} appointments to check`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No appointments need reminders at this time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let remindersSent = 0;

    for (const appointment of appointments as AppointmentWithRecipient[]) {
      try {
        // Parse appointment time and check if it's exactly 30 minutes away
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const minutesDiff = Math.round(timeDiff / (1000 * 60));

        console.log(`📊 Appointment ${appointment.id}: ${minutesDiff} minutes away`);

        // Only send reminder if appointment is between 25-35 minutes away (to account for cron timing variations)
        if (minutesDiff >= 25 && minutesDiff <= 35) {
          const recipient = appointment.recipient;
          
          // Format the reminder message
          const message = `📅 Terminerinnerung!\n\n` +
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
            `⏰ Der Termin beginnt in ca. 30 Minuten!`;

          console.log(`📤 Sending reminder for appointment ${appointment.id} to ${chatIds.length} chat(s)`);

          let messageSentSuccessfully = false;

          // Send message to all configured chat IDs
          for (const chat of chatIds) {
            try {
              const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: chat.chat_id,
                  text: message,
                }),
              });

              if (telegramResponse.ok) {
                console.log(`✅ Reminder sent successfully to ${chat.name} (${chat.chat_id})`);
                messageSentSuccessfully = true;
              } else {
                const errorText = await telegramResponse.text();
                console.error(`❌ Failed to send to ${chat.name} (${chat.chat_id}):`, errorText);
              }
            } catch (error) {
              console.error(`❌ Error sending to ${chat.name} (${chat.chat_id}):`, error);
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
              console.error('Error recording reminder:', reminderError);
              // Continue anyway since the message was sent
            }

            remindersSent++;
            console.log(`✅ Reminder sent for appointment ${appointment.id}`);
          } else {
            console.error(`❌ Failed to send reminder for appointment ${appointment.id} to any chat`);
          }
        }
      } catch (error) {
        console.error(`Error processing appointment ${appointment.id}:`, error);
        // Continue with other appointments
      }
    }

    console.log(`🎉 Sent ${remindersSent} appointment reminders`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        chatIds: chatIds.length,
        message: `Sent ${remindersSent} appointment reminders to ${chatIds.length} chat(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-appointment-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

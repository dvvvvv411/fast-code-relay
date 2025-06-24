
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, parseISO } from 'https://esm.sh/date-fns@3.6.0';
import { de } from 'https://esm.sh/date-fns@3.6.0/locale';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId }: ConfirmationEmailRequest = await req.json();

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get appointment data with recipient information
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        recipient:appointment_recipients(*)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Termin nicht gefunden' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const recipient = appointment.recipient;
    if (!recipient) {
      return new Response(
        JSON.stringify({ error: 'Empfänger nicht gefunden' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format date and time for German locale
    const appointmentDate = parseISO(appointment.appointment_date);
    const formattedDate = format(appointmentDate, 'EEEE, dd. MMMM yyyy', { locale: de });
    const formattedTime = appointment.appointment_time.slice(0, 5); // Remove seconds

    // Fixed sender email address
    const senderEmail = 'karriere@email.expandere-agentur.com';

    // Create HTML email content for confirmation
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            Terminbestätigung
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Ihr Termin wurde erfolgreich gebucht
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
            Hallo ${recipient.first_name} ${recipient.last_name}!
          </h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            Vielen Dank für Ihre Terminbuchung! Wir freuen uns, Ihnen mitteilen zu können, 
            dass Ihr Bewerbungsgespräch erfolgreich gebucht wurde.
          </p>

          <!-- Appointment Details -->
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
              Ihre Termindetails:
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333; width: 30%;">
                  Datum:
                </td>
                <td style="padding: 8px 0; color: #555;">
                  ${formattedDate}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">
                  Uhrzeit:
                </td>
                <td style="padding: 8px 0; color: #555;">
                  ${formattedTime} Uhr
                </td>
              </tr>
            </table>
          </div>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            Wir werden Sie kurz vor dem Termin telefonisch kontaktieren, um das Gespräch 
            zu führen. Bitte stellen Sie sicher, dass Sie zu der vereinbarten Zeit 
            telefonisch erreichbar sind.
          </p>

          <!-- What to expect -->
          <div style="background-color: #fff7ed; padding: 25px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
              Was Sie erwartet:
            </h3>
            <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Persönliches Kennenlernen (ca. 30 Minuten)</li>
              <li style="margin-bottom: 8px;">Vorstellung der Position und des Teams</li>
              <li style="margin-bottom: 8px;">Ihre Fragen zur Stelle und zum Unternehmen</li>
              <li style="margin-bottom: 8px;">Anruf kurz vor dem vereinbarten Termin</li>
            </ul>
          </div>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 10px;">
            Sollten Sie Fragen haben oder den Termin verschieben müssen, können Sie uns 
            gerne kontaktieren.
          </p>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 10px;">
            Wir freuen uns auf das Gespräch mit Ihnen!
          </p>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin: 0;">
            Mit freundlichen Grüßen<br/>
            <strong>Ihr Recruiting-Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <div style="margin-bottom: 20px;">
            <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">
              Expandere
            </h3>
            <p style="color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9;">
              Ihr Partner für innovative Lösungen
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <a href="https://expandere-agentur.com" style="color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9;">
              expandere-agentur.com
            </a>
            <a href="https://expandere-agentur.com/impressum" style="color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9;">
              Impressum
            </a>
            <a href="https://expandere-agentur.com/datenschutz" style="color: #ffffff; text-decoration: none; font-size: 14px; opacity: 0.9;">
              Datenschutz
            </a>
          </div>
          
          <p style="color: #ffffff; font-size: 12px; margin: 0; opacity: 0.8;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
          </p>
        </div>
      </div>
    `;

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: `Expandere <${senderEmail}>`,
      to: [recipient.email],
      subject: "Terminbestätigung - Ihr Bewerbungsgespräch bei Expandere",
      html: htmlContent,
    });

    console.log("Confirmation email sent successfully:", emailResponse);
    console.log("Sender email used:", senderEmail);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Bestätigungs-E-Mail erfolgreich versendet',
      senderEmail: senderEmail
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Fehler beim Senden der Bestätigungs-E-Mail' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

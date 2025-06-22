
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId }: EmailRequest = await req.json();

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

    if (appointmentError || !appointment || !appointment.recipient) {
      console.error('Error fetching appointment:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate booking URL with correct domain
    const bookingUrl = `https://termin.expandere-agentur.net/termin-buchen/${appointment.recipient.unique_token}`;

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            Verpasster Termin
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Wir möchten Ihnen helfen, einen neuen Termin zu finden
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
            Hallo ${appointment.recipient.first_name} ${appointment.recipient.last_name}!
          </h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            Wir haben bemerkt, dass Sie Ihren Termin am 
            <strong>${new Date(appointment.appointment_date).toLocaleDateString('de-DE')}</strong> 
            um <strong>${appointment.appointment_time}</strong> verpasst haben.
          </p>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
            Kein Problem! Wir verstehen, dass unvorhergesehene Dinge passieren können. 
            Gerne können Sie uns direkt anrufen oder einen neuen Termin buchen.
          </p>

          <!-- Call to Action Buttons - Phone First -->
          <div style="text-align: center; margin: 40px 0;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px solid #ff6b35; display: inline-block; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">
                Rufen Sie uns direkt an:
              </p>
              <a href="tel:+4971125299903" style="color: #ff6b35; font-size: 24px; font-weight: bold; text-decoration: none;">
                +49 0711 25299903
              </a>
            </div>
            
            <div style="margin: 20px 0; color: #666; font-size: 14px;">
              oder
            </div>
            
            <a 
              href="${bookingUrl}"
              style="background-color: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);"
            >
              Neuen Termin buchen
            </a>
          </div>

          <!-- Important Notice -->
          <div style="background-color: #fff3f0; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
              Wichtiger Hinweis:
            </h3>
            <p style="color: #555; line-height: 1.6; margin: 0; font-size: 16px;">
              Sie haben 15 Minuten Zeit, uns anzurufen und Ihren aktuellen Termin wahrzunehmen. 
              Nach dieser Zeit buchen Sie bitte einen neuen Termin über den Link oben. 
              Erscheinen Sie dann 15 Minuten vor Ihrem neuen Termin für eine reibungslose Abwicklung.
            </p>
          </div>

          <!-- Fallback Link -->
          <div style="background-color: #f1f3f4; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
              <strong>Falls der Button nicht funktioniert:</strong><br/>
              Kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:
            </p>
            <p style="margin: 0;">
              <a href="${bookingUrl}" style="color: #ff6b35; word-break: break-all; font-size: 14px; text-decoration: none;">
                ${bookingUrl}
              </a>
            </p>
          </div>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 10px;">
            Wir freuen uns darauf, Sie bald bei uns begrüßen zu dürfen!
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
            <a href="https://expandere-agentur.net" style="color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9;">
              expandere-agentur.net
            </a>
            <a href="https://expandere-agentur.net/impressum" style="color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9;">
              Impressum
            </a>
            <a href="https://expandere-agentur.net/datenschutz" style="color: #ffffff; text-decoration: none; font-size: 14px; opacity: 0.9;">
              Datenschutz
            </a>
          </div>
          
          <p style="color: #ffffff; font-size: 12px; margin: 0; opacity: 0.8;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
          </p>
        </div>
      </div>
    `;

    // Send email using Resend with verified sender
    const emailResponse = await resend.emails.send({
      from: `Expandere <karriere@email.expandere-agentur.com>`,
      to: [appointment.recipient.email],
      subject: "Verpasster Termin - Neuen Termin buchen bei Expandere",
      html: htmlContent,
    });

    console.log("Missed appointment email sent successfully:", emailResponse);

    // Check for email sending errors
    if (emailResponse.error) {
      console.error("Email sending error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'E-Mail für verpassten Termin erfolgreich versendet'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-missed-appointment-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Fehler beim Senden der E-Mail für verpassten Termin' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

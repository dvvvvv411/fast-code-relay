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
  recipientId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientId }: EmailRequest = await req.json();

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recipient data
    const { data: recipient, error: recipientError } = await supabase
      .from('appointment_recipients')
      .select('*')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      console.error('Error fetching recipient:', recipientError);
      return new Response(
        JSON.stringify({ error: 'Recipient not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate booking URL with correct domain
    const bookingUrl = `https://termin.expandere-agentur.net/termin-buchen/${recipient.unique_token}`;

    // Generate random number for dynamic sender email
    const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
    const dynamicSenderEmail = `noreply${randomNumber}@email.expandere-agentur.com`;

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            Herzlichen Glückwunsch!
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Ihre Bewerbung war erfolgreich
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
            Hallo ${recipient.first_name} ${recipient.last_name}!
          </h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Bewerbung erfolgreich eingegangen ist und 
            unser Interesse geweckt hat. Als nächsten Schritt möchten wir Sie gerne zu einem persönlichen 
            Gespräch einladen.
          </p>

          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
            Bitte wählen Sie einen für Sie passenden Termin aus den verfügbaren Zeiten aus. 
            Klicken Sie dafür einfach auf den Button unten.
          </p>

          <!-- Call to Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a 
              href="${bookingUrl}"
              style="background-color: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);"
            >
              Termin buchen
            </a>
          </div>

          <!-- Additional Information -->
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
              Was Sie erwartet:
            </h3>
            <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Persönliches Kennenlernen (ca. 30 Minuten)</li>
              <li style="margin-bottom: 8px;">Vorstellung der Position und des Teams</li>
              <li style="margin-bottom: 8px;">Ihre Fragen zur Stelle und zum Unternehmen</li>
            </ul>
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

    // Send email using Resend with dynamic sender
    const emailResponse = await resend.emails.send({
      from: `Expandere <${dynamicSenderEmail}>`,
      to: [recipient.email],
      subject: "Herzlichen Glückwunsch - Terminbuchung für Ihr Bewerbungsgespräch bei Expandere",
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);
    console.log("Dynamic sender email used:", dynamicSenderEmail);

    // Update recipient to mark email as sent
    const { error: updateError } = await supabase
      .from('appointment_recipients')
      .update({ email_sent: true })
      .eq('id', recipientId);

    if (updateError) {
      console.error('Error updating recipient email_sent status:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'E-Mail erfolgreich versendet',
      senderEmail: dynamicSenderEmail
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Fehler beim Senden der E-Mail' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

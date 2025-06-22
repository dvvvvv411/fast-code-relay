
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractRequestEmailRequest {
  appointmentId: string;
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { appointmentId, recipientEmail, recipientFirstName, recipientLastName }: ContractRequestEmailRequest = await req.json();

    console.log('📧 Processing contract request email for:', { appointmentId, recipientEmail, recipientFirstName, recipientLastName });

    // Generate a unique token
    const token = crypto.randomUUID();
    console.log('🔑 Generated token:', token);
    
    // Store the token in the database
    const { error: tokenError } = await supabase
      .from('contract_request_tokens')
      .insert({
        appointment_id: appointmentId,
        token: token,
        email_sent: true
      });

    if (tokenError) {
      console.error('❌ Error creating contract token:', tokenError);
      throw new Error('Failed to create contract request token');
    }

    console.log('✅ Token stored successfully');

    // Create the contract form URL
    const contractUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/arbeitsvertrag?token=${token}`;
    console.log('🔗 Generated contract URL:', contractUrl);

    // Send email with verified sender address
    const emailResponse = await resend.emails.send({
      from: `Expandere <karriere@email.expandere-agentur.com>`,
      to: [recipientEmail],
      subject: "Arbeitsvertrag - Ihre Bewerbung bei Expandere",
      html: `
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
              Hallo ${recipientFirstName} ${recipientLastName}!
            </h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Nach unserem erfolgreichen Gespräch freuen wir uns, Ihnen einen Arbeitsvertrag bei Expandere anzubieten. 
              Um den Einstellungsprozess abzuschließen, benötigen wir noch einige wichtige Informationen von Ihnen.
            </p>

            <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              Bitte füllen Sie das folgende Formular aus, um Ihre Vertragsdaten zu übermitteln. 
              Klicken Sie dafür einfach auf den Button unten.
            </p>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a 
                href="${contractUrl}"
                style="background-color: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);"
              >
                Arbeitsvertrag ausfüllen
              </a>
            </div>

            <!-- Information Box -->
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
                Benötigte Unterlagen:
              </h3>
              <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Personalausweis (Vorder- und Rückseite)</li>
                <li style="margin-bottom: 8px;">Sozialversicherungsnummer</li>
                <li style="margin-bottom: 8px;">Steuerliche Identifikationsnummer</li>
                <li style="margin-bottom: 8px;">Krankenversicherungsdaten</li>
                <li style="margin-bottom: 8px;">Bankverbindung (IBAN)</li>
              </ul>
            </div>

            <!-- Fallback Link -->
            <div style="background-color: #f1f3f4; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                <strong>Falls der Button nicht funktioniert:</strong><br/>
                Kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:
              </p>
              <p style="margin: 0;">
                <a href="${contractUrl}" style="color: #ff6b35; word-break: break-all; font-size: 14px; text-decoration: none;">
                  ${contractUrl}
                </a>
              </p>
            </div>

            <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 10px;">
              Bei Fragen stehen wir Ihnen gerne zur Verfügung.
            </p>

            <p style="color: #555; line-height: 1.6; font-size: 16px; margin: 0;">
              Mit freundlichen Grüßen<br/>
              <strong>Ihr Expandere-Team</strong>
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
      `,
    });

    console.log("✅ Contract request email sent successfully:", emailResponse);

    // Check for email sending errors
    if (emailResponse.error) {
      console.error("❌ Email sending error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error}`);
    }

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      contractUrl: contractUrl,
      token: token,
      message: 'Arbeitsvertrag-E-Mail erfolgreich versendet'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-contract-request-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Fehler beim Senden der Arbeitsvertrag-E-Mail'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

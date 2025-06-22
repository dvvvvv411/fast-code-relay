
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const generateToken = () => {
  return Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
};

interface EmailRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId }: EmailRequest = await req.json();

    // Get appointment data
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        recipient:appointment_recipients(*)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    if (!appointment.recipient) {
      throw new Error('Recipient not found');
    }

    // Check if token already exists
    let { data: existingToken } = await supabase
      .from('contract_request_tokens')
      .select('token')
      .eq('appointment_id', appointmentId)
      .single();

    let token;
    if (existingToken) {
      token = existingToken.token;
    } else {
      // Generate new token
      token = generateToken();
      
      // Save token to database
      const { error: tokenError } = await supabase
        .from('contract_request_tokens')
        .insert({
          appointment_id: appointmentId,
          token: token,
          email_sent: true
        });

      if (tokenError) {
        throw tokenError;
      }
    }

    const contractUrl = `https://uylujlvfyhftgaztwowf.supabase.co/arbeitsvertrag/${token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Expandere Recruiting <onboarding@resend.dev>",
      to: [appointment.recipient.email],
      subject: "Arbeitsvertrag - Weitere Informationen erforderlich",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
              Arbeitsvertrag - Weitere Informationen erforderlich
            </h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Bitte vervollständigen Sie Ihre Bewerbungsunterlagen
            </p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
              Hallo ${appointment.recipient.first_name} ${appointment.recipient.last_name}!
            </h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Vielen Dank für Ihr Interesse an unserer Stelle. Für die Erstellung Ihres Arbeitsvertrags 
              benötigen wir noch einige zusätzliche Informationen von Ihnen.
            </p>

            <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              Bitte klicken Sie auf den Button unten, um das Formular auszufüllen und die erforderlichen 
              Dokumente hochzuladen.
            </p>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a 
                href="${contractUrl}"
                style="background-color: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);"
              >
                Arbeitsvertrags-Informationen ausfüllen
              </a>
            </div>

            <!-- Required Information -->
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
                Benötigte Informationen:
              </h3>
              <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Persönliche Daten (Name, E-Mail)</li>
                <li style="margin-bottom: 8px;">Gewünschtes Startdatum</li>
                <li style="margin-bottom: 8px;">Sozialversicherungsnummer</li>
                <li style="margin-bottom: 8px;">Steuernummer</li>
                <li style="margin-bottom: 8px;">Krankenversicherung (Name & Nummer)</li>
                <li style="margin-bottom: 8px;">IBAN für Gehaltsüberweisung</li>
                <li style="margin-bottom: 8px;">Kopien Ihres Personalausweises (Vorder- und Rückseite)</li>
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
              Dieser Link ist 7 Tage gültig. Bitte füllen Sie das Formular zeitnah aus.
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
      `,
    });

    console.log("Employment contract email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-employment-contract-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

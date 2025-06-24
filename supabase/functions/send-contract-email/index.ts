
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContractEmailRequest {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
  };
  recipient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  contractToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointment, recipient, contractToken }: ContractEmailRequest = await req.json();

    // Use the correct preview URL
    const contractUrl = `https://preview--fast-code-relay.lovable.app/arbeitsvertrag/${contractToken}`;

    // Fixed sender email address
    const senderEmail = 'karriere@email.expandere-agentur.com';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Orange Header -->
        <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            Arbeitsvertrag
          </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
            Weitere Informationen erforderlich
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
            Liebe/r ${recipient.first_name} ${recipient.last_name}!
          </h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
            Vielen Dank für Ihr Interesse an einer Zusammenarbeit mit uns. Um den Arbeitsvertrag vorbereiten zu können, 
            benötigen wir noch einige zusätzliche Informationen von Ihnen.
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
            Bitte füllen Sie das folgende Formular vollständig aus:
          </p>
          
          <!-- Call to Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a 
              href="${contractUrl}"
              style="background-color: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;"
            >
              Formular ausfüllen
            </a>
          </div>
          
          <!-- Important Notice -->
          <div style="background-color: #fff3cd; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
            <p style="color: #856404; margin: 0; font-size: 16px;">
              <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig. Bitte füllen Sie das Formular zeitnah aus.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 15px;">
            Das Formular umfasst folgende Informationen:
          </p>
          
          <ul style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 30px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Persönliche Daten</li>
            <li style="margin-bottom: 8px;">Sozialversicherungsnummer</li>
            <li style="margin-bottom: 8px;">Steuernummer</li>
            <li style="margin-bottom: 8px;">Bankverbindung (IBAN/BIC)</li>
            <li style="margin-bottom: 8px;">Krankenkasse</li>
            <li style="margin-bottom: 8px;">Kopien Ihres Personalausweises</li>
          </ul>

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
            <strong>Ihr Team</strong>
          </p>
        </div>

        <!-- Branded Footer -->
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
            <a 
              href="https://expandere-agentur.com" 
              style="color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9;"
            >
              expandere-agentur.com
            </a>
            <a 
              href="https://expandere-agentur.com/impressum" 
              style="color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9;"
            >
              Impressum
            </a>
            <a 
              href="https://expandere-agentur.com/datenschutz" 
              style="color: #ffffff; text-decoration: none; font-size: 14px; opacity: 0.9;"
            >
              Datenschutz
            </a>
          </div>
          
          <p style="color: #ffffff; font-size: 12px; margin: 0; opacity: 0.8;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `Expandere <${senderEmail}>`,
      to: [recipient.email],
      subject: "Arbeitsvertrag - Zusätzliche Informationen erforderlich",
      html: emailHtml,
    });

    console.log("Contract email sent successfully:", emailResponse);
    console.log("Sender email used:", senderEmail);

    return new Response(JSON.stringify({
      ...emailResponse,
      senderEmail: senderEmail
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
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

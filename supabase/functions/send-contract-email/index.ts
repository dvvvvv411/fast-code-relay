
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

    const contractUrl = `${Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://uylujlvfyhftgaztwowf.')?.replace('.supabase.co', '.lovable.app')}/arbeitsvertrag/${contractToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px;">
            Arbeitsvertrag - Weitere Informationen erforderlich
          </h1>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Liebe/r ${recipient.first_name} ${recipient.last_name},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            vielen Dank für Ihr Interesse an einer Zusammenarbeit mit uns. Um den Arbeitsvertrag vorbereiten zu können, 
            benötigen wir noch einige zusätzliche Informationen von Ihnen.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Bitte füllen Sie das folgende Formular vollständig aus:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="${contractUrl}"
              style="background-color: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;"
            >
              Formular ausfüllen
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
            Alternativ können Sie folgenden Link in Ihren Browser kopieren:
          </p>
          
          <p style="font-size: 14px; color: #0066cc; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
            ${contractUrl}
          </p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #856404; margin: 0;">
              <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig. Bitte füllen Sie das Formular zeitnah aus.
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Das Formular umfasst folgende Informationen:
          </p>
          
          <ul style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
            <li>Persönliche Daten</li>
            <li>Sozialversicherungsnummer</li>
            <li>Steuernummer</li>
            <li>Bankverbindung (IBAN/BIC)</li>
            <li>Krankenkasse</li>
            <li>Kopien Ihres Personalausweises</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Bei Fragen stehen wir Ihnen gerne zur Verfügung.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 5px;">
            Mit freundlichen Grüßen,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">
            Ihr Team
          </p>
        </div>
        
        <div style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
          <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Termine <noreply@resend.dev>",
      to: [recipient.email],
      subject: "Arbeitsvertrag - Zusätzliche Informationen erforderlich",
      html: emailHtml,
    });

    console.log("Contract email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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

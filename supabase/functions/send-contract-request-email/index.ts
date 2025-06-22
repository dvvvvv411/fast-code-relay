
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractRequestData {
  appointmentId: string;
  recipientEmail: string;
  recipientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, recipientEmail, recipientName }: ContractRequestData = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate unique token
    const token = crypto.randomUUID().replace(/-/g, '');

    // Store the token in the database
    const { error: tokenError } = await supabase
      .from('contract_request_tokens')
      .insert({
        appointment_id: appointmentId,
        token: token,
        email_sent: true
      });

    if (tokenError) {
      console.error('Error storing token:', tokenError);
      throw new Error('Failed to store contract token');
    }

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const contractUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/vertrag/${token}`;

    const emailResponse = await resend.emails.send({
      from: "SLS Advisors <noreply@sls-advisors.net>",
      to: [recipientEmail],
      subject: "Arbeitsvertrag - Weitere Informationen erforderlich",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Arbeitsvertrag - Weitere Informationen erforderlich</h2>
          
          <p>Liebe/r ${recipientName},</p>
          
          <p>vielen Dank für Ihr Interesse an einer Zusammenarbeit mit uns. Um Ihren Arbeitsvertrag vorzubereiten, benötigen wir noch einige zusätzliche Informationen von Ihnen.</p>
          
          <p>Bitte klicken Sie auf den folgenden Link, um das Formular auszufüllen:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Informationen eingeben
            </a>
          </div>
          
          <p><strong>Wichtiger Hinweis:</strong> Dieser Link ist 7 Tage gültig. Sollten Sie den Link nicht mehr verwenden können, kontaktieren Sie uns bitte.</p>
          
          <h3>Benötigte Informationen:</h3>
          <ul>
            <li>Bankverbindung (IBAN/BIC)</li>
            <li>Sozialversicherungsnummer</li>
            <li>Steuernummer</li>
            <li>Krankenkasse</li>
            <li>Personalausweis (Vorder- und Rückseite)</li>
            <li>Gewünschtes Startdatum</li>
          </ul>
          
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          
          <p>Mit freundlichen Grüßen,<br>
          Ihr SLS Advisors Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            SLS Advisors<br>
            E-Mail: info@sls-advisors.net
          </p>
        </div>
      `,
    });

    console.log("Contract request email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contract request email sent successfully",
        tokenId: token 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-contract-request-email function:", error);
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

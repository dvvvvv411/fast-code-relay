
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface ContractRequestEmailRequest {
  appointmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId }: ContractRequestEmailRequest = await req.json();

    // Get appointment and recipient details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        recipient:appointment_recipients(*)
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment?.recipient) {
      throw new Error("Appointment or recipient not found");
    }

    // Generate a secure token for the contract request
    const { data: tokenData, error: tokenError } = await supabase
      .rpc("generate_secure_token");

    if (tokenError) {
      throw new Error("Failed to generate token");
    }

    const token = tokenData;

    // Store the token in the database
    const { error: insertError } = await supabase
      .from("contract_request_tokens")
      .insert({
        appointment_id: appointmentId,
        token: token,
        email_sent: true
      });

    if (insertError) {
      throw new Error("Failed to store token");
    }

    // Create the contract form URL
    const contractFormUrl = `https://uylujlvfyhftgaztwowf.supabase.co/contract-form?token=${token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Arbeitsvertrag <onboarding@resend.dev>",
      to: [appointment.recipient.email],
      subject: "Arbeitsvertrag - Weitere Informationen erforderlich",
      html: `
        <h1>Hallo ${appointment.recipient.first_name} ${appointment.recipient.last_name},</h1>
        
        <p>vielen Dank für Ihr Interesse an der Stelle. Um den Arbeitsvertrag vorzubereiten, benötigen wir noch einige weitere Informationen von Ihnen.</p>
        
        <p>Bitte klicken Sie auf den folgenden Link, um das Formular auszufüllen:</p>
        
        <p><a href="${contractFormUrl}" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Arbeitsvertrag-Formular ausfüllen</a></p>
        
        <p>Dieser Link ist 7 Tage gültig. Falls Sie Fragen haben, können Sie sich gerne bei uns melden.</p>
        
        <p>Mit freundlichen Grüßen,<br>
        Ihr Personalteam</p>
        
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          Falls der Button nicht funktioniert, können Sie auch diesen Link kopieren und in Ihren Browser einfügen:<br>
          ${contractFormUrl}
        </p>
      `,
    });

    console.log("Contract request email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contract request email sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
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

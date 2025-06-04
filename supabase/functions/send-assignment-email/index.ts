
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssignmentEmailRequest {
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
  assignmentId: string;
  phoneNumberId?: string; // Made optional
}

interface Assignment {
  id: string;
  assignment_url: string;
  auftraege: {
    title: string;
    anbieter: string;
    auftragsnummer: string;
    projektziel: string;
  };
}

interface PhoneNumber {
  id: string;
  phone: string;
  access_code: string;
}

const generateEmailTemplate = (
  recipientFirstName: string,
  recipientLastName: string,
  assignment: Assignment,
  phoneNumber?: PhoneNumber
) => {
  const assignmentUrl = `https://auftrag.expandere-agentur.net/assignment/${assignment.assignment_url}`;
  const smsPageUrl = "https://sms.expandere-agentur.net";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Modern Header without Logo -->
      <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
          Neuer Auftrag verfügbar!
        </h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
          Sie haben einen neuen Auftrag erhalten
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
          Hallo ${recipientFirstName} ${recipientLastName}!
        </h2>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
          Sie haben einen neuen Auftrag erhalten, den Sie bearbeiten können. 
          Klicken Sie auf den Button unten, um die Details einzusehen und zu beginnen.
        </p>

        <!-- Assignment Details -->
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin-bottom: 30px;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
            Auftragsdetails:
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333; width: 40%;">
                Titel:
              </td>
              <td style="padding: 8px 0; color: #555;">
                ${assignment.auftraege.title}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">
                Auftragsnummer:
              </td>
              <td style="padding: 8px 0; color: #555;">
                ${assignment.auftraege.auftragsnummer}
              </td>
            </tr>
          </table>
        </div>

        <!-- Call to Action Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${assignmentUrl}" style="background-color: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;">
            Auftrag einsehen
          </a>
        </div>

        ${phoneNumber ? `
        <!-- SMS Verification Section -->
        <div style="background-color: #fff7ed; padding: 25px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 30px;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
            SMS-Verifikation erforderlich:
          </h3>
          <p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">
            Für diesen Auftrag benötigen Sie eine SMS-Verifikation. Verwenden Sie dafür folgende Daten:
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333; width: 40%;">
                Telefonnummer:
              </td>
              <td style="color: #333; font-family: monospace; background-color: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                ${phoneNumber.phone}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">
                Zugangscode:
              </td>
              <td style="color: #333; font-family: monospace; background-color: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">
                ${phoneNumber.access_code}
              </td>
            </tr>
          </table>
        </div>

        <!-- SMS Button -->
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${smsPageUrl}" style="background-color: #ea580c; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3); transition: all 0.3s ease;">
            Zur SMS-Seite
          </a>
        </div>

        <!-- Instructions -->
        <div style="background-color: #f1f3f4; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0;">
            <strong>Anleitung:</strong><br/>
            Gehen Sie zur SMS-Seite, geben Sie die Telefonnummer und den Zugangscode ein, 
            um eine SMS-Verifikation zu erhalten.
          </p>
        </div>
        ` : ''}
      </div>

      <!-- Expandere Branded Footer -->
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
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientFirstName,
      recipientLastName,
      assignmentId,
      phoneNumberId, // Now optional
    }: AssignmentEmailRequest = await req.json();

    console.log("Received assignment email request:", {
      recipientEmail,
      recipientFirstName,
      recipientLastName,
      assignmentId,
      phoneNumberId,
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch assignment details
    const { data: assignment, error: assignmentError } = await supabase
      .from('auftrag_assignments')
      .select(`
        id,
        assignment_url,
        auftraege (
          title,
          anbieter,
          auftragsnummer,
          projektziel
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error("Error fetching assignment:", assignmentError);
      throw new Error("Assignment not found");
    }

    let phoneNumber: PhoneNumber | undefined;

    // Only fetch phone number if phoneNumberId is provided
    if (phoneNumberId) {
      const { data: phoneData, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('id, phone, access_code')
        .eq('id', phoneNumberId)
        .single();

      if (phoneError || !phoneData) {
        console.error("Error fetching phone number:", phoneError);
        throw new Error("Phone number not found");
      }

      phoneNumber = phoneData;
    }

    console.log("Assignment fetched successfully, phone number:", phoneNumber ? "included" : "not included");

    // Generate random prefix for email address
    const randomPrefix = Math.random().toString(36).substring(2, 12);
    const fromEmail = `${randomPrefix}@email.expandere-agentur.com`;

    // Generate email HTML
    const emailHtml = generateEmailTemplate(
      recipientFirstName,
      recipientLastName,
      assignment as Assignment,
      phoneNumber
    );

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: `Expandere <${fromEmail}>`,
      to: [recipientEmail],
      subject: `Neuer Auftrag: ${assignment.auftraege.title}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        message: "Assignment email sent successfully",
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
    console.error("Error in send-assignment-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

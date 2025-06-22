
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptContractRequest {
  contractId: string;
  startDate: string;
}

const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 7; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const createWelcomeEmailHTML = (firstName: string, lastName: string, email: string, password: string, startDate: string, isNewAccount: boolean): string => {
  const accountStatusText = isNewAccount 
    ? "Ihr Benutzerkonto wurde erfolgreich erstellt" 
    : "Ihre Zugangsdaten wurden aktualisiert";
    
  const welcomeText = isNewAccount 
    ? "Herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde offiziell angenommen und Ihr Benutzerkonto wurde erfolgreich erstellt."
    : "Herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde offiziell angenommen und Ihre Zugangsdaten wurden aktualisiert.";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .welcome-box { background-color: #f8f9fa; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0; }
        .credentials-box { background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credentials-title { color: #1976d2; font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; }
        .credential-item { background-color: white; padding: 10px; margin: 8px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .credential-label { font-weight: bold; color: #555; }
        .credential-value { font-family: monospace; background-color: #f5f5f5; padding: 4px 8px; border-radius: 3px; }
        .important-note { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
        .button { display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
        .logo { max-width: 150px; height: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Willkommen im Team!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${accountStatusText}</p>
        </div>
        
        <div class="content">
          <div class="welcome-box">
            <h2 style="margin-top: 0; color: #ff6b35;">Hallo ${firstName} ${lastName}!</h2>
            <p>${welcomeText}</p>
            <p><strong>Ihr Startdatum:</strong> ${new Date(startDate).toLocaleDateString('de-DE', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          
          <div class="credentials-box">
            <div class="credentials-title">
              🔐 Ihre Zugangsdaten
            </div>
            <div class="credential-item">
              <span class="credential-label">E-Mail-Adresse:</span>
              <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Passwort:</span>
              <span class="credential-value">${password}</span>
            </div>
          </div>
          
          <div class="important-note">
            <h3 style="margin-top: 0; color: #856404;">⚠️ Wichtige Sicherheitshinweise</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung</li>
              <li>Teilen Sie Ihre Zugangsdaten niemals mit anderen</li>
              <li>Bewahren Sie diese E-Mail sicher auf</li>
            </ul>
          </div>
          
          <h3>📋 Nächste Schritte</h3>
          <ol>
            <li>Loggen Sie sich mit den oben genannten Zugangsdaten ein</li>
            <li>Vervollständigen Sie Ihr Profil</li>
            <li>Lesen Sie die Unternehmensrichtlinien</li>
            <li>Bei Fragen kontaktieren Sie die Personalabteilung</li>
          </ol>
          
          <p style="margin-top: 30px;">Wir freuen uns darauf, mit Ihnen zu arbeiten und heißen Sie herzlich in unserem Team willkommen!</p>
          
          <p style="margin-top: 20px;">
            <strong>Mit freundlichen Grüßen,<br>
            Das HR-Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>Diese E-Mail wurde automatisch generiert. Bei Fragen oder Problemen wenden Sie sich bitte an die Personalabteilung.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} - Alle Rechte vorbehalten</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 Accept employment contract function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contractId, startDate }: AcceptContractRequest = await req.json();
    console.log("📝 Processing contract acceptance:", { contractId, startDate });

    if (!contractId || !startDate) {
      return new Response(
        JSON.stringify({ error: "contractId and startDate are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error("❌ Error fetching contract:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("✅ Contract found:", { email: contract.email, name: `${contract.first_name} ${contract.last_name}` });

    // Generate password
    const password = generatePassword();
    console.log("🔐 Password generated");

    let authUser;
    let isNewAccount = false;

    // Check if user already exists
    console.log("🔍 Checking if user already exists...");
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Error checking existing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing users: " + listError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const existingUser = existingUsers.users.find(user => user.email === contract.email);

    if (existingUser) {
      console.log("👤 User already exists, updating password...");
      
      // Update existing user's password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          user_metadata: {
            first_name: contract.first_name,
            last_name: contract.last_name,
            role: 'employee'
          }
        }
      );

      if (updateError) {
        console.error("❌ Error updating existing user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update existing user: " + updateError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      authUser = { user: updatedUser.user };
      isNewAccount = false;
      console.log("✅ Existing user updated:", authUser.user?.id);
    } else {
      console.log("👤 Creating new user account...");
      
      // Create new user account
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: contract.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: contract.first_name,
          last_name: contract.last_name,
          role: 'employee'
        }
      });

      if (authError) {
        console.error("❌ Error creating new user:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account: " + authError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      authUser = newUser;
      isNewAccount = true;
      console.log("✅ New user account created:", authUser.user?.id);
    }

    // Update contract status and account information
    const { error: updateError } = await supabase
      .from('employment_contracts')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        start_date: startDate,
        account_created: true,
        account_password: password,
        account_created_at: new Date().toISOString(),
        user_id: authUser.user?.id
      })
      .eq('id', contractId);

    if (updateError) {
      console.error("❌ Error updating contract:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update contract status" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("✅ Contract updated successfully");

    // Send welcome email
    const emailHTML = createWelcomeEmailHTML(
      contract.first_name,
      contract.last_name,
      contract.email,
      password,
      startDate,
      isNewAccount
    );

    const emailSubject = isNewAccount 
      ? `🎉 Willkommen im Team - Ihr Arbeitsvertrag wurde angenommen!`
      : `🎉 Arbeitsvertrag angenommen - Zugangsdaten aktualisiert!`;

    const { error: emailError } = await resend.emails.send({
      from: "HR Team <onboarding@resend.dev>",
      to: [contract.email],
      subject: emailSubject,
      html: emailHTML,
    });

    if (emailError) {
      console.error("❌ Error sending email:", emailError);
      // Don't fail the entire operation if email fails, just log it
      console.log("⚠️ Contract was accepted but email failed to send");
    } else {
      console.log("✅ Welcome email sent successfully");
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Contract accepted and ${isNewAccount ? 'account created' : 'account updated'} successfully`,
        user_id: authUser.user?.id,
        is_new_account: isNewAccount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

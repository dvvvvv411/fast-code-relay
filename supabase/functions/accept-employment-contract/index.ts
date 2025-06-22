
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Orange Header -->
      <div style="background-color: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
          🎉 Willkommen im Team!
        </h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
          ${accountStatusText}
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0; font-size: 24px; margin-bottom: 20px;">
          Hallo ${firstName} ${lastName}!
        </h2>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
          ${welcomeText}
        </p>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
          <strong>Ihr Startdatum:</strong> ${new Date(startDate).toLocaleDateString('de-DE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        
        <!-- Credentials Box -->
        <div style="background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #1976d2; font-weight: bold; margin: 0 0 15px 0; font-size: 18px;">
            🔐 Ihre Zugangsdaten
          </h3>
          <div style="background-color: white; padding: 15px; margin: 10px 0; border-radius: 4px;">
            <p style="margin: 0; color: #555; font-size: 14px;">
              <strong>E-Mail-Adresse:</strong><br/>
              <span style="font-family: monospace; background-color: #f5f5f5; padding: 4px 8px; border-radius: 3px; font-size: 16px;">${email}</span>
            </p>
          </div>
          <div style="background-color: white; padding: 15px; margin: 10px 0; border-radius: 4px;">
            <p style="margin: 0; color: #555; font-size: 14px;">
              <strong>Passwort:</strong><br/>
              <span style="font-family: monospace; background-color: #f5f5f5; padding: 4px 8px; border-radius: 3px; font-size: 16px;">${password}</span>
            </p>
          </div>
          
          <!-- Login Button -->
          <div style="text-align: center; margin-top: 20px;">
            <a 
              href="https://expandere-agentur.net"
              style="background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;"
            >
              Jetzt anmelden
            </a>
          </div>
        </div>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin: 30px 0 20px 0;">
          Ab Ihrem Startdatum werden Sie Ihre täglichen Aufgaben im Mitarbeiter-Dashboard einsehen können.
        </p>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin: 30px 0 20px 0;">
          Wir freuen uns darauf, mit Ihnen zu arbeiten und heißen Sie herzlich in unserem Team willkommen!
        </p>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px; margin: 0;">
          Mit freundlichen Grüßen<br/>
          <strong>Dein Expandere Team</strong>
        </p>
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
          Diese E-Mail wurde automatisch generiert. Bei Fragen oder Problemen wenden Sie sich bitte an die Personalabteilung.
        </p>
      </div>
    </div>
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

      // Assign 'user' role to the new user (not admin)
      console.log("👤 Assigning 'user' role to new employee...");
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user?.id,
          role: 'user'
        });

      if (roleError) {
        console.error("❌ Error assigning user role:", roleError);
        // Don't fail the entire operation, just log the error
        console.log("⚠️ User account created but role assignment failed");
      } else {
        console.log("✅ User role assigned successfully");
      }
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
      from: "Expandere Agentur <karriere@email.expandere-agentur.com>",
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

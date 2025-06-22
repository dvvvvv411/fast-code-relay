
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptContractRequest {
  contractId: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting employment contract acceptance process');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { contractId }: AcceptContractRequest = await req.json();
    console.log('📋 Processing contract ID:', contractId);

    // Get contract details
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('employment_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('❌ Contract not found:', contractError);
      throw new Error('Contract not found');
    }

    console.log('✅ Contract found:', contract.email);

    // Check if user already exists by listing users and filtering by email
    const { data: { users }, error: userListError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userListError) {
      console.error('❌ Error listing users:', userListError);
      throw new Error(`Failed to check existing users: ${userListError.message}`);
    }

    const existingUser = users.find(user => user.email === contract.email);
    
    let userId: string;
    let temporaryPassword: string | null = null;

    if (existingUser) {
      console.log('👤 User already exists, using existing account');
      userId = existingUser.id;
    } else {
      console.log('🆕 Creating new user account');
      
      // Generate temporary password
      temporaryPassword = generateTemporaryPassword();
      
      // Create user account
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: contract.email,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: contract.first_name,
          last_name: contract.last_name,
          employment_contract_id: contractId
        }
      });

      if (createUserError || !newUser.user) {
        console.error('❌ Error creating user:', createUserError);
        throw new Error(`Failed to create user account: ${createUserError?.message}`);
      }

      userId = newUser.user.id;
      console.log('✅ User created successfully:', userId);
    }

    // Update contract status
    const { error: updateError } = await supabaseAdmin
      .from('employment_contracts')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        user_id: userId
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('❌ Error updating contract:', updateError);
      throw new Error(`Failed to update contract: ${updateError.message}`);
    }

    console.log('✅ Contract updated successfully');

    // Send welcome email with credentials
    const emailHtml = generateWelcomeEmail({
      firstName: contract.first_name,
      lastName: contract.last_name,
      email: contract.email,
      temporaryPassword,
      loginUrl: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'http://localhost:3000'}/auth`
    });

    const emailResult = await resend.emails.send({
      from: 'Expandere <noreply@email.expandere-agentur.com>',
      to: [contract.email],
      subject: 'Willkommen bei Expandere - Ihr Zugang ist bereit!',
      html: emailHtml,
    });

    console.log('📧 Email sent:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: temporaryPassword 
          ? 'Contract accepted, user account created, and welcome email sent'
          : 'Contract accepted and existing user notified'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in accept-employment-contract function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface WelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string | null;
  loginUrl: string;
}

function generateWelcomeEmail(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen bei Expandere</title>
        <style>
            body { font-family: 'Arial, sans-serif'; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: '0 auto'; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; color: white; }
            .header p { color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; background: #ffffff; }
            .welcome-text { font-size: 24px; margin-top: 0; margin-bottom: 20px; color: #333; }
            .credentials-box { background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #ff6b35; margin: 25px 0; }
            .credentials-title { font-size: 18px; font-weight: bold; color: #333; margin: 0 0 15px 0; }
            .credential-item { margin: 10px 0; display: flex; align-items: center; }
            .credential-label { font-weight: bold; min-width: 100px; color: #333; width: 40%; }
            .credential-value { color: #333; font-family: monospace; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px; flex: 1; }
            .login-button { display: inline-block; background: #ff6b35; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; text-align: center; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); }
            .important-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .fallback-link { background: #f1f3f4; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
            .footer { background: #ff6b35; padding: 30px 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .footer h3 { color: #ffffff; margin: 0 0 10px 0; font-size: 20px; font-weight: bold; }
            .footer p { color: #ffffff; font-size: 14px; margin: 0; opacity: 0.9; }
            .footer a { color: #ffffff; text-decoration: none; font-size: 14px; margin-right: 20px; opacity: 0.9; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Willkommen bei Expandere!</h1>
                <p>Ihr Arbeitsvertrag wurde erfolgreich angenommen</p>
            </div>
            <div class="content">
                <h2 class="welcome-text">
                    Hallo ${data.firstName} ${data.lastName}!
                </h2>
                
                <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                    Herzlich willkommen im Team! Ihr Arbeitsvertrag wurde erfolgreich angenommen und Ihr Zugang zu unserem System ist bereit.
                </p>
                
                ${data.temporaryPassword ? `
                <div class="credentials-box">
                    <div class="credentials-title">
                        🔐 Ihre Anmeldedaten
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">E-Mail:</span>
                        <span class="credential-value">${data.email}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Passwort:</span>
                        <span class="credential-value">${data.temporaryPassword}</span>
                    </div>
                </div>
                
                <div class="important-note">
                    <strong>⚠️ Wichtiger Hinweis:</strong> Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung aus Sicherheitsgründen.
                </div>
                ` : `
                <div class="credentials-box">
                    <div class="credentials-title">
                        ✅ Bestehender Account
                    </div>
                    <p style="margin: 0; color: #555;">Sie können sich mit Ihren bestehenden Anmeldedaten anmelden.</p>
                </div>
                `}
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${data.loginUrl}" class="login-button">
                        🚀 Jetzt anmelden
                    </a>
                </div>
                
                <div class="fallback-link">
                    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                        <strong>Falls der Button nicht funktioniert:</strong><br/>
                        Kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:
                    </p>
                    <p style="margin: 0;">
                        <a href="${data.loginUrl}" style="color: #ff6b35; word-break: break-all; font-size: 14px; text-decoration: none;">
                            ${data.loginUrl}
                        </a>
                    </p>
                </div>
                
                <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 10px;">
                    Bei Fragen oder Problemen wenden Sie sich gerne an unser Support-Team.
                </p>
                
                <p style="color: #555; line-height: 1.6; font-size: 16px; margin-bottom: 10px;">
                    Wir freuen uns auf die Zusammenarbeit!
                </p>
                
                <p style="margin-top: 30px; color: #555; line-height: 1.6; font-size: 16px; margin: 0;">
                    Mit freundlichen Grüßen,<br>
                    <strong>Das Expandere Team</strong>
                </p>
            </div>
            <div class="footer">
                <div style="margin-bottom: 20px;">
                    <h3>Expandere</h3>
                    <p>Ihr Partner für innovative Lösungen</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <a href="https://expandere-agentur.com">expandere-agentur.com</a>
                    <a href="https://expandere-agentur.com/impressum">Impressum</a>
                    <a href="https://expandere-agentur.com/datenschutz">Datenschutz</a>
                </div>
                
                <p style="font-size: 12px; opacity: 0.8;">
                    Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

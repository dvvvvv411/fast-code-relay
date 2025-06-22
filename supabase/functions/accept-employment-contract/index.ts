
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

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.getUserByEmail(contract.email);
    
    let userId: string;
    let temporaryPassword: string | null = null;

    if (existingUser.user) {
      console.log('👤 User already exists, using existing account');
      userId = existingUser.user.id;
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
      from: 'SLS Advisors <noreply@sls-advisors.net>',
      to: [contract.email],
      subject: 'Willkommen bei SLS Advisors - Ihr Zugang ist bereit!',
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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
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
        <title>Willkommen bei SLS Advisors</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 40px; }
            .welcome-text { font-size: 18px; margin-bottom: 20px; color: #2c3e50; }
            .credentials-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0; }
            .credentials-title { font-size: 16px; font-weight: 600; color: #495057; margin-bottom: 15px; display: flex; align-items: center; }
            .credential-item { margin: 10px 0; display: flex; align-items: center; }
            .credential-label { font-weight: 600; min-width: 100px; color: #6c757d; }
            .credential-value { background: white; padding: 8px 12px; border-radius: 4px; border: 1px solid #dee2e6; font-family: monospace; flex: 1; }
            .login-button { display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; text-align: center; transition: transform 0.2s; }
            .login-button:hover { transform: translateY(-2px); }
            .important-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .icon { width: 20px; height: 20px; margin-right: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Willkommen bei SLS Advisors!</h1>
            </div>
            <div class="content">
                <div class="welcome-text">
                    Liebe/r ${data.firstName} ${data.lastName},
                </div>
                <p>herzlich willkommen im Team! Ihr Arbeitsvertrag wurde erfolgreich angenommen und Ihr Zugang zu unserem System ist bereit.</p>
                
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
                    <p>Sie können sich mit Ihren bestehenden Anmeldedaten anmelden.</p>
                </div>
                `}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.loginUrl}" class="login-button">
                        🚀 Jetzt anmelden
                    </a>
                </div>
                
                <p>Bei Fragen oder Problemen wenden Sie sich gerne an unser Support-Team.</p>
                
                <p>Wir freuen uns auf die Zusammenarbeit!</p>
                
                <p style="margin-top: 30px;">
                    Mit freundlichen Grüßen,<br>
                    <strong>Das SLS Advisors Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>SLS Advisors | Ihr Partner für digitale Lösungen</p>
                <p style="font-size: 12px; opacity: 0.8;">
                    Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

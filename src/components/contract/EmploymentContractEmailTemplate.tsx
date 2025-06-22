
import React from 'react';

interface EmploymentContractEmailTemplateProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  startDate: string;
  isNewAccount: boolean;
}

const EmploymentContractEmailTemplate: React.FC<EmploymentContractEmailTemplateProps> = ({
  firstName,
  lastName,
  email,
  password,
  startDate,
  isNewAccount
}) => {
  const accountStatusText = isNewAccount 
    ? "Ihr Benutzerkonto wurde erfolgreich erstellt" 
    : "Ihre Zugangsdaten wurden aktualisiert";
    
  const welcomeText = isNewAccount 
    ? "Herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde offiziell angenommen und Ihr Benutzerkonto wurde erfolgreich erstellt."
    : "Herzlichen Glückwunsch! Ihr Arbeitsvertrag wurde offiziell angenommen und Ihre Zugangsdaten wurden aktualisiert.";

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Orange Header */}
      <div style={{ backgroundColor: '#ff6b35', padding: '30px 20px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
          🎉 Willkommen im Team!
        </h1>
        <p style={{ color: 'white', margin: '10px 0 0 0', fontSize: '16px', opacity: '0.9' }}>
          {accountStatusText}
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
        <h2 style={{ color: '#333', marginTop: '0', fontSize: '24px', marginBottom: '20px' }}>
          Hallo {firstName} {lastName}!
        </h2>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '20px' }}>
          {welcomeText}
        </p>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>
          <strong>Ihr Startdatum:</strong> {new Date(startDate).toLocaleDateString('de-DE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        
        {/* Credentials Box */}
        <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '25px', margin: '25px 0' }}>
          <h3 style={{ color: '#1976d2', fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '18px' }}>
            🔐 Ihre Zugangsdaten
          </h3>
          <div style={{ backgroundColor: 'white', padding: '15px', margin: '10px 0', borderRadius: '4px' }}>
            <p style={{ margin: '0', color: '#555', fontSize: '14px' }}>
              <strong>E-Mail-Adresse:</strong><br/>
              <span style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '3px', fontSize: '16px' }}>{email}</span>
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '15px', margin: '10px 0', borderRadius: '4px' }}>
            <p style={{ margin: '0', color: '#555', fontSize: '14px' }}>
              <strong>Passwort:</strong><br/>
              <span style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '3px', fontSize: '16px' }}>{password}</span>
            </p>
          </div>
        </div>
        
        {/* Important Notice */}
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '25px', margin: '25px 0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '18px' }}>
            ⚠️ Wichtige Sicherheitshinweise
          </h3>
          <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#856404', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '8px' }}>Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung</li>
            <li style={{ marginBottom: '8px' }}>Teilen Sie Ihre Zugangsdaten niemals mit anderen</li>
            <li style={{ marginBottom: '8px' }}>Bewahren Sie diese E-Mail sicher auf</li>
          </ul>
        </div>
        
        <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '15px' }}>
          📋 Nächste Schritte
        </h3>
        <ol style={{ color: '#555', fontSize: '16px', lineHeight: '1.6', marginBottom: '30px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Loggen Sie sich mit den oben genannten Zugangsdaten ein</li>
          <li style={{ marginBottom: '8px' }}>Vervollständigen Sie Ihr Profil</li>
          <li style={{ marginBottom: '8px' }}>Lesen Sie die Unternehmensrichtlinien</li>
          <li style={{ marginBottom: '8px' }}>Bei Fragen kontaktieren Sie die Personalabteilung</li>
        </ol>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', margin: '30px 0 20px 0' }}>
          Wir freuen uns darauf, mit Ihnen zu arbeiten und heißen Sie herzlich in unserem Team willkommen!
        </p>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', margin: '0' }}>
          Mit freundlichen Grüßen<br/>
          <strong>Das HR-Team</strong>
        </p>
      </div>

      {/* Expandere Branded Footer */}
      <div style={{ backgroundColor: '#ff6b35', padding: '30px 20px', textAlign: 'center', borderRadius: '0 0 8px 8px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#ffffff', margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold' }}>
            Expandere
          </h3>
          <p style={{ color: '#ffffff', fontSize: '14px', margin: '0', opacity: '0.9' }}>
            Ihr Partner für innovative Lösungen
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <a 
            href="https://expandere-agentur.com" 
            style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', marginRight: '20px', opacity: '0.9' }}
          >
            expandere-agentur.com
          </a>
          <a 
            href="https://expandere-agentur.com/impressum" 
            style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', marginRight: '20px', opacity: '0.9' }}
          >
            Impressum
          </a>
          <a 
            href="https://expandere-agentur.com/datenschutz" 
            style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', opacity: '0.9' }}
          >
            Datenschutz
          </a>
        </div>
        
        <p style={{ color: '#ffffff', fontSize: '12px', margin: '0', opacity: '0.8' }}>
          Diese E-Mail wurde automatisch generiert. Bei Fragen oder Problemen wenden Sie sich bitte an die Personalabteilung.
        </p>
      </div>
    </div>
  );
};

export default EmploymentContractEmailTemplate;

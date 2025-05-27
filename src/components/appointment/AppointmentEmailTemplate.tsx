
import React from 'react';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
  email_sent: boolean;
  created_at: string;
}

interface AppointmentEmailTemplateProps {
  recipientFirstName: string;
  recipientLastName: string;
  recipient: Recipient;
}

const AppointmentEmailTemplate: React.FC<AppointmentEmailTemplateProps> = ({
  recipientFirstName,
  recipientLastName,
  recipient
}) => {
  const bookingUrl = `${window.location.origin}/appointment-booking?token=${recipient.unique_token}`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Header with Logo */}
      <div style={{ 
        backgroundColor: '#ff6b35', 
        padding: '30px 20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: 'white', 
          borderRadius: '50%', 
          margin: '0 auto 20px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ff6b35'
        }}>
          LOGO
        </div>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
          Herzlichen Glückwunsch!
        </h1>
        <p style={{ color: 'white', margin: '10px 0 0 0', fontSize: '16px', opacity: '0.9' }}>
          Ihre Bewerbung war erfolgreich
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
        <h2 style={{ color: '#333', marginTop: '0', fontSize: '24px', marginBottom: '20px' }}>
          Hallo {recipientFirstName} {recipientLastName}!
        </h2>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '20px' }}>
          Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Bewerbung erfolgreich eingegangen ist und 
          unser Interesse geweckt hat. Als nächsten Schritt möchten wir Sie gerne zu einem persönlichen 
          Gespräch einladen.
        </p>

        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>
          Bitte wählen Sie einen für Sie passenden Termin aus den verfügbaren Zeiten aus. 
          Klicken Sie dafür einfach auf den Button unten.
        </p>

        {/* Call to Action Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={bookingUrl}
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '18px 40px',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            Interview-Termin buchen
          </a>
        </div>

        {/* Additional Information */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '25px', 
          borderRadius: '8px', 
          borderLeft: '4px solid #ff6b35',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '18px' }}>
            Was Sie erwartet:
          </h3>
          <ul style={{ color: '#555', lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Persönliches Kennenlernen (ca. 45-60 Minuten)</li>
            <li style={{ marginBottom: '8px' }}>Vorstellung der Position und des Teams</li>
            <li style={{ marginBottom: '8px' }}>Ihre Fragen zur Stelle und zum Unternehmen</li>
          </ul>
        </div>

        {/* Fallback Link */}
        <div style={{ 
          backgroundColor: '#f1f3f4', 
          padding: '20px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
            <strong>Falls der Button nicht funktioniert:</strong><br/>
            Kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:
          </p>
          <p style={{ margin: '0' }}>
            <a href={bookingUrl} style={{ 
              color: '#ff6b35', 
              wordBreak: 'break-all', 
              fontSize: '14px',
              textDecoration: 'none'
            }}>
              {bookingUrl}
            </a>
          </p>
        </div>

        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '10px' }}>
          Wir freuen uns auf das Gespräch mit Ihnen!
        </p>

        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', margin: '0' }}>
          Mit freundlichen Grüßen<br/>
          <strong>Ihr Recruiting-Team</strong>
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px 20px', 
        textAlign: 'center', 
        borderTop: '1px solid #e9ecef',
        borderRadius: '0 0 8px 8px'
      }}>
        <p style={{ color: '#6c757d', fontSize: '12px', margin: '0 0 10px 0' }}>
          Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
        </p>
        <p style={{ color: '#6c757d', fontSize: '12px', margin: '0' }}>
          Bei Fragen wenden Sie sich bitte an: <a href="mailto:recruiting@unternehmen.de" style={{ color: '#ff6b35' }}>recruiting@unternehmen.de</a>
        </p>
      </div>
    </div>
  );
};

export default AppointmentEmailTemplate;

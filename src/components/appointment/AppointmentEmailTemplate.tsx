
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
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#ff6b35', margin: '0', fontSize: '24px' }}>Terminbuchung</h1>
        <p style={{ color: '#666', margin: '10px 0 0 0' }}>Buchen Sie Ihren persönlichen Termin</p>
      </div>

      {/* Main Content */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#333', marginTop: '0' }}>Hallo {recipientFirstName} {recipientLastName}!</h2>
        
        <p style={{ color: '#555', lineHeight: '1.6' }}>
          Wir freuen uns, Ihnen mitteilen zu können, dass Sie einen Termin buchen können. 
          Klicken Sie auf den Button unten, um Ihren bevorzugten Termin auszuwählen.
        </p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a 
            href={bookingUrl}
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '5px',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            Termin buchen
          </a>
        </div>

        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
          Falls der Button nicht funktioniert, können Sie auch diesen Link kopieren und in Ihren Browser einfügen:<br/>
          <a href={bookingUrl} style={{ color: '#ff6b35', wordBreak: 'break-all' }}>{bookingUrl}</a>
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#999', fontSize: '12px' }}>
        <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
        <p>Falls Sie Fragen haben, wenden Sie sich bitte an unser Support-Team.</p>
      </div>
    </div>
  );
};

export default AppointmentEmailTemplate;

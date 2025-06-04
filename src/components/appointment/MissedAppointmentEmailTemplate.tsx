
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

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

interface MissedAppointmentEmailTemplateProps {
  recipientFirstName: string;
  recipientLastName: string;
  recipient: Recipient;
  appointment: Appointment;
}

const MissedAppointmentEmailTemplate: React.FC<MissedAppointmentEmailTemplateProps> = ({
  recipientFirstName,
  recipientLastName,
  recipient,
  appointment
}) => {
  const bookingUrl = `${window.location.origin}/appointment-booking?token=${recipient.unique_token}`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#ff6b35', 
        padding: '30px 20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
          Verpasster Termin
        </h1>
        <p style={{ color: 'white', margin: '10px 0 0 0', fontSize: '16px', opacity: '0.9' }}>
          Wir möchten Ihnen helfen, einen neuen Termin zu finden
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
        <h2 style={{ color: '#333', marginTop: '0', fontSize: '24px', marginBottom: '20px' }}>
          Hallo {recipientFirstName} {recipientLastName}!
        </h2>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '20px' }}>
          Wir haben bemerkt, dass Sie Ihren Termin am{' '}
          <strong>{new Date(appointment.appointment_date).toLocaleDateString('de-DE')}</strong>{' '}
          um <strong>{appointment.appointment_time}</strong> verpasst haben.
        </p>

        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>
          Kein Problem! Wir verstehen, dass unvorhergesehene Dinge passieren können. 
          Gerne können Sie uns direkt anrufen oder einen neuen Termin buchen.
        </p>

        {/* Call to Action Buttons - Swapped Order */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            border: '2px solid #ff6b35',
            display: 'inline-block',
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
              Rufen Sie uns direkt an:
            </p>
            <a href="tel:+4971125299903" style={{
              color: '#ff6b35',
              fontSize: '24px',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}>
              +49 0711 25299903
            </a>
          </div>
          
          <div style={{ margin: '20px 0', color: '#666', fontSize: '14px' }}>
            oder
          </div>
          
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
            Neuen Termin buchen
          </a>
        </div>

        {/* Important Notice - Updated Text */}
        <div style={{ 
          backgroundColor: '#fff3f0', 
          padding: '25px', 
          borderRadius: '8px', 
          borderLeft: '4px solid #ff6b35',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '18px' }}>
            Wichtiger Hinweis:
          </h3>
          <p style={{ color: '#555', lineHeight: '1.6', margin: '0', fontSize: '16px' }}>
            Sie haben 15 Minuten Zeit, uns anzurufen und Ihren aktuellen Termin wahrzunehmen. 
            Nach dieser Zeit buchen Sie bitte einen neuen Termin über den Link oben. 
            Erscheinen Sie dann 15 Minuten vor Ihrem neuen Termin für eine reibungslose Abwicklung.
          </p>
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
          Wir freuen uns darauf, Sie bald bei uns begrüßen zu dürfen!
        </p>

        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', margin: '0' }}>
          Mit freundlichen Grüßen<br/>
          <strong>Ihr Recruiting-Team</strong>
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        backgroundColor: '#ff6b35', 
        padding: '30px 20px', 
        textAlign: 'center', 
        borderRadius: '0 0 8px 8px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            color: '#ffffff', 
            margin: '0 0 10px 0', 
            fontSize: '20px', 
            fontWeight: 'bold' 
          }}>
            Expandere
          </h3>
          <p style={{ color: '#ffffff', fontSize: '14px', margin: '0', opacity: '0.9' }}>
            Ihr Partner für innovative Lösungen
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <a 
            href="https://expandere-agentur.com" 
            style={{ 
              color: '#ffffff', 
              textDecoration: 'none', 
              fontSize: '14px',
              marginRight: '20px',
              opacity: '0.9'
            }}
          >
            expandere-agentur.com
          </a>
          <a 
            href="https://expandere-agentur.com/impressum" 
            style={{ 
              color: '#ffffff', 
              textDecoration: 'none', 
              fontSize: '14px',
              marginRight: '20px',
              opacity: '0.9'
            }}
          >
            Impressum
          </a>
          <a 
            href="https://expandere-agentur.com/datenschutz" 
            style={{ 
              color: '#ffffff', 
              textDecoration: 'none', 
              fontSize: '14px',
              opacity: '0.9'
            }}
          >
            Datenschutz
          </a>
        </div>
        
        <p style={{ color: '#ffffff', fontSize: '12px', margin: '0', opacity: '0.8' }}>
          Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
        </p>
      </div>
    </div>
  );
};

export default MissedAppointmentEmailTemplate;

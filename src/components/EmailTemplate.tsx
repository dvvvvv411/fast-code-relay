
import React from 'react';

interface EmailTemplateProps {
  recipientFirstName: string;
  recipientLastName: string;
  assignment: {
    assignment_url: string;
    auftraege: {
      title: string;
      anbieter: string;
      auftragsnummer: string;
      projektziel: string;
    };
  };
  phoneNumber: {
    phone: string;
    access_code: string;
  };
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  recipientFirstName,
  recipientLastName,
  assignment,
  phoneNumber
}) => {
  const assignmentUrl = `${window.location.origin}/assignment/${assignment.assignment_url}`;
  const landingPageUrl = window.location.origin;

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e5e5',
      borderRadius: '8px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #f97316',
        paddingBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <img 
            src="https://ulbgpsjexsgcpivphrxq.supabase.co/storage/v1/object/public/branding/logo_dark_1741580695335.png" 
            alt="SMS Relay Logo" 
            style={{ 
              height: '60px', 
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
        <h1 style={{ color: '#333333', margin: '0', fontSize: '24px' }}>
          Neuer Auftrag verfügbar
        </h1>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <p style={{ fontSize: '16px', color: '#333333', lineHeight: '1.6' }}>
          Hallo {recipientFirstName} {recipientLastName},
        </p>
        <p style={{ fontSize: '16px', color: '#333333', lineHeight: '1.6' }}>
          Sie haben einen neuen Auftrag erhalten, den Sie bearbeiten können.
        </p>
      </div>

      <div style={{
        backgroundColor: '#fef7f0',
        padding: '20px',
        borderRadius: '6px',
        marginBottom: '25px',
        border: '1px solid #fed7aa'
      }}>
        <h2 style={{ color: '#f97316', margin: '0 0 15px 0', fontSize: '18px' }}>
          Auftragsdetails
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#92400e', width: '40%' }}>
              Titel:
            </td>
            <td style={{ padding: '8px 0', color: '#333333' }}>
              {assignment.auftraege.title}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#92400e' }}>
              Auftragsnummer:
            </td>
            <td style={{ padding: '8px 0', color: '#333333' }}>
              {assignment.auftraege.auftragsnummer}
            </td>
          </tr>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <a 
          href={assignmentUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#f97316',
            color: '#ffffff',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '10px',
            boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)'
          }}
        >
          Auftrag einsehen
        </a>
      </div>

      <div style={{
        backgroundColor: '#fef3e2',
        padding: '20px',
        borderRadius: '6px',
        marginBottom: '25px',
        border: '1px solid #f59e0b'
      }}>
        <h3 style={{ color: '#d97706', margin: '0 0 15px 0', fontSize: '16px' }}>
          SMS-Verifikation erforderlich
        </h3>
        <p style={{ fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 15px 0' }}>
          Für diesen Auftrag benötigen Sie eine SMS-Verifikation. Verwenden Sie dafür folgende Daten:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#92400e', width: '40%' }}>
              Telefonnummer:
            </td>
            <td style={{ 
              color: '#333333',
              fontFamily: 'monospace',
              backgroundColor: '#ffffff',
              padding: '4px 8px',
              borderRadius: '3px',
              border: '1px solid #fed7aa'
            }}>
              {phoneNumber.phone}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#92400e' }}>
              Zugangscode:
            </td>
            <td style={{ 
              color: '#333333',
              fontFamily: 'monospace',
              backgroundColor: '#ffffff',
              padding: '4px 8px',
              borderRadius: '3px',
              border: '1px solid #fed7aa'
            }}>
              {phoneNumber.access_code}
            </td>
          </tr>
        </table>
        <p style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.6', margin: '15px 0 0 0' }}>
          Gehen Sie zur SMS-Seite, geben Sie die Telefonnummer und den Zugangscode ein, 
          um eine SMS-Verifikation zu erhalten.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <a 
          href={landingPageUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#ea580c',
            color: '#ffffff',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '10px',
            boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
          }}
        >
          Zur SMS-Seite
        </a>
      </div>

      <div style={{
        borderTop: '1px solid #fed7aa',
        paddingTop: '20px',
        fontSize: '12px',
        color: '#92400e',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0' }}>
          Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
        </p>
      </div>
    </div>
  );
};

export default EmailTemplate;

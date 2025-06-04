
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
  phoneNumber?: {
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
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Modern Header without Logo */}
      <div style={{ 
        backgroundColor: '#ff6b35', 
        padding: '30px 20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
          Neuer Auftrag verfügbar!
        </h1>
        <p style={{ color: 'white', margin: '10px 0 0 0', fontSize: '16px', opacity: '0.9' }}>
          Sie haben einen neuen Auftrag erhalten
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
        <h2 style={{ color: '#333', marginTop: '0', fontSize: '24px', marginBottom: '20px' }}>
          Hallo {recipientFirstName} {recipientLastName}!
        </h2>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>
          Sie haben einen neuen Auftrag erhalten, den Sie bearbeiten können. 
          Klicken Sie auf den Button unten, um die Details einzusehen und zu beginnen.
        </p>

        {/* Assignment Details */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '25px', 
          borderRadius: '8px', 
          borderLeft: '4px solid #ff6b35',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '18px' }}>
            Auftragsdetails:
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#333', width: '40%' }}>
                Titel:
              </td>
              <td style={{ padding: '8px 0', color: '#555' }}>
                {assignment.auftraege.title}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#333' }}>
                Auftragsnummer:
              </td>
              <td style={{ padding: '8px 0', color: '#555' }}>
                {assignment.auftraege.auftragsnummer}
              </td>
            </tr>
          </table>
        </div>

        {/* Call to Action Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={assignmentUrl}
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
            Auftrag einsehen
          </a>
        </div>

        {/* SMS Verification Section - Only shown if phone number is provided */}
        {phoneNumber && (
          <>
            <div style={{ 
              backgroundColor: '#fff7ed', 
              padding: '25px', 
              borderRadius: '8px', 
              borderLeft: '4px solid #f97316',
              marginBottom: '30px'
            }}>
              <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '18px' }}>
                SMS-Verifikation erforderlich:
              </h3>
              <p style={{ color: '#555', lineHeight: '1.6', margin: '0 0 15px 0' }}>
                Für diesen Auftrag benötigen Sie eine SMS-Verifikation. Verwenden Sie dafür folgende Daten:
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#333', width: '40%' }}>
                    Telefonnummer:
                  </td>
                  <td style={{ 
                    color: '#333',
                    fontFamily: 'monospace',
                    backgroundColor: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>
                    {phoneNumber.phone}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#333' }}>
                    Zugangscode:
                  </td>
                  <td style={{ 
                    color: '#333',
                    fontFamily: 'monospace',
                    backgroundColor: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>
                    {phoneNumber.access_code}
                  </td>
                </tr>
              </table>
            </div>

            {/* SMS Button */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <a 
                href={landingPageUrl}
                style={{
                  backgroundColor: '#ea580c',
                  color: 'white',
                  padding: '18px 40px',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  display: 'inline-block',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                Zur SMS-Seite
              </a>
            </div>

            {/* Instructions */}
            <div style={{ 
              backgroundColor: '#f1f3f4', 
              padding: '20px', 
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', margin: '0' }}>
                <strong>Anleitung:</strong><br/>
                Gehen Sie zur SMS-Seite, geben Sie die Telefonnummer und den Zugangscode ein, 
                um eine SMS-Verifikation zu erhalten.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Expandere Branded Footer */}
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

export default EmailTemplate;

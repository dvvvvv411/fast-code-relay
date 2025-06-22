
import React from 'react';

interface ContractEmailTemplateProps {
  recipientFirstName: string;
  recipientLastName: string;
  contractToken: string;
}

const ContractEmailTemplate: React.FC<ContractEmailTemplateProps> = ({
  recipientFirstName,
  recipientLastName,
  contractToken
}) => {
  const contractUrl = `${window.location.origin}/arbeitsvertrag/${contractToken}`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {/* Orange Header */}
      <div style={{ 
        backgroundColor: '#ff6b35', 
        padding: '30px 20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <h1 style={{ color: 'white', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
          Arbeitsvertrag
        </h1>
        <p style={{ color: 'white', margin: '10px 0 0 0', fontSize: '16px', opacity: '0.9' }}>
          Weitere Informationen erforderlich
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
        <h2 style={{ color: '#333', marginTop: '0', fontSize: '24px', marginBottom: '20px' }}>
          Liebe/r {recipientFirstName} {recipientLastName}!
        </h2>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '20px' }}>
          Vielen Dank für Ihr Interesse an einer Zusammenarbeit mit uns. Um den Arbeitsvertrag vorbereiten zu können, 
          benötigen wir noch einige zusätzliche Informationen von Ihnen.
        </p>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>
          Bitte füllen Sie das folgende Formular vollständig aus:
        </p>
        
        {/* Call to Action Button */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a 
            href={contractUrl}
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
            Formular ausfüllen
          </a>
        </div>
        
        {/* Important Notice */}
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '25px', 
          borderRadius: '8px', 
          borderLeft: '4px solid #ff6b35',
          marginBottom: '30px'
        }}>
          <p style={{ color: '#856404', margin: '0', fontSize: '16px' }}>
            <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig. Bitte füllen Sie das Formular zeitnah aus.
          </p>
        </div>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '15px' }}>
          Das Formular umfasst folgende Informationen:
        </p>
        
        <ul style={{ color: '#555', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Persönliche Daten</li>
          <li style={{ marginBottom: '8px' }}>Sozialversicherungsnummer</li>
          <li style={{ marginBottom: '8px' }}>Steuernummer</li>
          <li style={{ marginBottom: '8px' }}>Bankverbindung (IBAN/BIC)</li>
          <li style={{ marginBottom: '8px' }}>Krankenkasse</li>
          <li style={{ marginBottom: '8px' }}>Kopien Ihres Personalausweises</li>
        </ul>

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
            <a href={contractUrl} style={{ 
              color: '#ff6b35', 
              wordBreak: 'break-all', 
              fontSize: '14px',
              textDecoration: 'none'
            }}>
              {contractUrl}
            </a>
          </p>
        </div>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '10px' }}>
          Bei Fragen stehen wir Ihnen gerne zur Verfügung.
        </p>
        
        <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', margin: '0' }}>
          Mit freundlichen Grüßen<br/>
          <strong>Ihr Team</strong>
        </p>
      </div>

      {/* Branded Footer */}
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

export default ContractEmailTemplate;

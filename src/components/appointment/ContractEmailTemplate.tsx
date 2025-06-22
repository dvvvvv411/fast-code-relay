
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
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '24px' }}>
          Arbeitsvertrag - Weitere Informationen erforderlich
        </h1>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px' }}>
          Liebe/r {recipientFirstName} {recipientLastName},
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px' }}>
          vielen Dank für Ihr Interesse an einer Zusammenarbeit mit uns. Um den Arbeitsvertrag vorbereiten zu können, 
          benötigen wir noch einige zusätzliche Informationen von Ihnen.
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
          Bitte füllen Sie das folgende Formular vollständig aus:
        </p>
        
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a 
            href={contractUrl}
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Formular ausfüllen
          </a>
        </div>
        
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Alternativ können Sie folgenden Link in Ihren Browser kopieren:
        </p>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#0066cc', 
          wordBreak: 'break-all',
          backgroundColor: '#f0f0f0',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {contractUrl}
        </p>
        
        <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#856404', margin: '0' }}>
            <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig. Bitte füllen Sie das Formular zeitnah aus.
          </p>
        </div>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px' }}>
          Das Formular umfasst folgende Informationen:
        </p>
        
        <ul style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px', paddingLeft: '20px' }}>
          <li>Persönliche Daten</li>
          <li>Sozialversicherungsnummer</li>
          <li>Steuernummer</li>
          <li>Bankverbindung (IBAN/BIC)</li>
          <li>Krankenkasse</li>
          <li>Kopien Ihres Personalausweises</li>
        </ul>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px' }}>
          Bei Fragen stehen wir Ihnen gerne zur Verfügung.
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '5px' }}>
          Mit freundlichen Grüßen,
        </p>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '0' }}>
          Ihr Team
        </p>
      </div>
      
      <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '20px' }}>
        <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
      </div>
    </div>
  );
};

export default ContractEmailTemplate;

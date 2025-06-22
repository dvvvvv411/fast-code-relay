
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  recipient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ContractRequestEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const ContractRequestEmailPreviewDialog: React.FC<ContractRequestEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  if (!appointment || !appointment.recipient) {
    return null;
  }

  // Generate example contract URL (matching the format from the edge function)
  const contractUrl = `${window.location.origin}/arbeitsvertrag?token=example-token-12345`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>E-Mail Vorschau - Arbeitsvertrag-Anfrage</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
              {/* Header */}
              <div style={{ backgroundColor: '#ff6b35', padding: '30px 20px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
                <h1 style={{ color: 'white', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
                  Herzlichen Glückwunsch!
                </h1>
                <p style={{ color: 'white', margin: '10px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  Ihre Bewerbung war erfolgreich
                </p>
              </div>

              {/* Main Content */}
              <div style={{ padding: '40px 30px', backgroundColor: '#ffffff' }}>
                <h2 style={{ color: '#333', marginTop: '0', fontSize: '24px', marginBottom: '20px' }}>
                  Hallo {appointment.recipient.first_name} {appointment.recipient.last_name}!
                </h2>
                
                <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '20px' }}>
                  Nach unserem erfolgreichen Gespräch freuen wir uns, Ihnen einen Arbeitsvertrag bei Expandere anzubieten. 
                  Um den Einstellungsprozess abzuschließen, benötigen wir noch einige wichtige Informationen von Ihnen.
                </p>

                <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>
                  Bitte füllen Sie das folgende Formular aus, um Ihre Vertragsdaten zu übermitteln. 
                  Klicken Sie dafür einfach auf den Button unten.
                </p>

                {/* Call to Action Button */}
                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                  <a 
                    href={contractUrl}
                    style={{ backgroundColor: '#ff6b35', color: 'white', padding: '18px 40px', textDecoration: 'none', borderRadius: '8px', display: 'inline-block', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)' }}
                  >
                    Arbeitsvertrag ausfüllen
                  </a>
                </div>

                {/* Information Box */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #ff6b35', marginBottom: '30px' }}>
                  <h3 style={{ color: '#333', margin: '0 0 15px 0', fontSize: '18px' }}>
                    Benötigte Unterlagen:
                  </h3>
                  <ul style={{ color: '#555', lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '8px' }}>Personalausweis (Vorder- und Rückseite)</li>
                    <li style={{ marginBottom: '8px' }}>Sozialversicherungsnummer</li>
                    <li style={{ marginBottom: '8px' }}>Steuerliche Identifikationsnummer</li>
                    <li style={{ marginBottom: '8px' }}>Krankenversicherungsdaten</li>
                    <li style={{ marginBottom: '8px' }}>Bankverbindung (IBAN)</li>
                  </ul>
                </div>

                {/* Fallback Link */}
                <div style={{ backgroundColor: '#f1f3f4', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
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
                  <strong>Ihr Expandere-Team</strong>
                </p>
              </div>

              {/* Footer */}
              <div style={{ backgroundColor: '#ff6b35', padding: '30px 20px', textAlign: 'center', borderRadius: '0 0 8px 8px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#ffffff', margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold' }}>
                    Expandere
                  </h3>
                  <p style={{ color: '#ffffff', fontSize: '14px', margin: '0', opacity: 0.9 }}>
                    Ihr Partner für innovative Lösungen
                  </p>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <a href="https://expandere-agentur.com" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', marginRight: '20px', opacity: 0.9 }}>
                    expandere-agentur.com
                  </a>
                  <a href="https://expandere-agentur.com/impressum" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', marginRight: '20px', opacity: 0.9 }}>
                    Impressum
                  </a>
                  <a href="https://expandere-agentur.com/datenschutz" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '14px', opacity: 0.9 }}>
                    Datenschutz
                  </a>
                </div>
                
                <p style={{ color: '#ffffff', fontSize: '12px', margin: '0', opacity: 0.8 }}>
                  Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContractRequestEmailPreviewDialog;

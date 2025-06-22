
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload, Send, Eye, EyeOff, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentData } from '@/hooks/useAppointmentData';
import RecipientImport from './RecipientImport';

const AppointmentRecipients = () => {
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [showSentEmails, setShowSentEmails] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [currentlySendingEmail, setCurrentlySendingEmail] = useState<string | null>(null);
  
  // New recipient form
  const [newRecipient, setNewRecipient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });

  const {
    recipients,
    isLoading,
    sendingEmails,
    createRecipient,
    deleteRecipient,
    handleSendEmail,
    loadRecipients
  } = useAppointmentData();

  // Multi-select functions
  const handleRecipientSelect = (recipientId: string, checked: boolean) => {
    setSelectedRecipients(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(recipientId);
      } else {
        newSet.delete(recipientId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingRecipientIds = filteredRecipients
        .filter(recipient => !recipient.email_sent)
        .map(recipient => recipient.id);
      setSelectedRecipients(new Set(pendingRecipientIds));
    } else {
      setSelectedRecipients(new Set());
    }
  };

  const handleBulkSendEmails = async () => {
    if (selectedRecipients.size === 0) return;

    setIsBulkSending(true);
    const selectedRecipientsList = Array.from(selectedRecipients);
    let successCount = 0;
    let errorCount = 0;

    for (const recipientId of selectedRecipientsList) {
      const recipient = recipients.find(r => r.id === recipientId);
      if (!recipient) continue;

      setCurrentlySendingEmail(recipientId);

      try {
        await handleSendEmail(recipient);
        successCount++;
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        errorCount++;
      }

      // Wait 1 second between emails to show progress
      if (recipientId !== selectedRecipientsList[selectedRecipientsList.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setCurrentlySendingEmail(null);
    setIsBulkSending(false);
    setSelectedRecipients(new Set());
  };

  const handleCreateRecipient = async () => {
    await createRecipient(newRecipient);
    setNewRecipient({ firstName: '', lastName: '', email: '', phoneNumber: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
          <p className="mt-2 text-gray-500">Lade Empfänger...</p>
        </div>
      </div>
    );
  }

  // Filter recipients based on showSentEmails toggle
  const filteredRecipients = showSentEmails 
    ? recipients 
    : recipients.filter(recipient => !recipient.email_sent);

  // Get recipients that can be selected (only those with pending emails)
  const selectableRecipients = filteredRecipients.filter(recipient => !recipient.email_sent);
  const isAllSelected = selectableRecipients.length > 0 && selectableRecipients.every(recipient => selectedRecipients.has(recipient.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Empfänger verwalten</h2>
      </div>

      {/* Import/Manual toggle */}
      <div className="flex space-x-2">
        <Button
          variant={!showImportPanel ? "default" : "outline"}
          onClick={() => setShowImportPanel(false)}
          className={!showImportPanel ? "bg-orange hover:bg-orange/90" : ""}
        >
          <Plus className="h-4 w-4 mr-2" />
          Manuell hinzufügen
        </Button>
        <Button
          variant={showImportPanel ? "default" : "outline"}
          onClick={() => setShowImportPanel(true)}
          className={showImportPanel ? "bg-orange hover:bg-orange/90" : ""}
        >
          <Upload className="h-4 w-4 mr-2" />
          TXT-Import
        </Button>
      </div>

      {/* Import Panel */}
      {showImportPanel ? (
        <RecipientImport onImportComplete={loadRecipients} />
      ) : (
        // Manual Entry Panel
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neuen Empfänger hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={newRecipient.firstName}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Vorname eingeben"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={newRecipient.lastName}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nachname eingeben"
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="E-Mail eingeben"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Telefonnummer</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={newRecipient.phoneNumber}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Telefonnummer eingeben"
                />
              </div>
            </div>
            <Button onClick={handleCreateRecipient} className="bg-orange hover:bg-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              Empfänger erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Empfänger verwalten</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSentEmails(!showSentEmails)}
                className="flex items-center gap-2"
              >
                {showSentEmails ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Versendete E-Mails ausblenden
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Versendete E-Mails anzeigen
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecipients.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {showSentEmails 
                ? "Keine Empfänger vorhanden." 
                : "Keine Empfänger mit ausstehenden E-Mails vorhanden."
              }
            </p>
          ) : (
            <div className="space-y-4">
              {/* Bulk Actions */}
              {selectableRecipients.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={isBulkSending}
                    />
                    <span className="text-sm font-medium">
                      {selectedRecipients.size > 0 
                        ? `${selectedRecipients.size} von ${selectableRecipients.length} Empfängern ausgewählt`
                        : 'Alle auswählen'
                      }
                    </span>
                  </div>
                  {selectedRecipients.size > 0 && (
                    <Button
                      onClick={handleBulkSendEmails}
                      disabled={isBulkSending}
                      className="bg-orange hover:bg-orange/90 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isBulkSending 
                        ? `E-Mails versenden... (${Array.from(selectedRecipients).indexOf(currentlySendingEmail || '') + 1}/${selectedRecipients.size})`
                        : `E-Mails an ${selectedRecipients.size} Empfänger versenden`
                      }
                    </Button>
                  )}
                </div>
              )}

              {/* Recipients List */}
              <div className="space-y-3">
                {filteredRecipients.map((recipient) => {
                  const isSelectable = !recipient.email_sent;
                  const isSelected = selectedRecipients.has(recipient.id);
                  const isSending = sendingEmails.has(recipient.id) || currentlySendingEmail === recipient.id;
                  
                  return (
                    <div 
                      key={recipient.id} 
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg transition-all",
                        isSelected && "bg-orange/5 border-orange/20",
                        isSending && "animate-pulse",
                        "hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        {isSelectable && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleRecipientSelect(recipient.id, checked as boolean)}
                            disabled={isBulkSending}
                          />
                        )}
                        <div>
                          <p className="font-medium">{recipient.first_name} {recipient.last_name}</p>
                          <p className="text-sm text-gray-500">{recipient.email}</p>
                          {recipient.phone_note && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <Phone className="h-3 w-3" />
                              <span>{recipient.phone_note}</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400">Token: {recipient.unique_token}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={recipient.email_sent ? "default" : "secondary"}>
                          {recipient.email_sent ? "E-Mail gesendet" : "E-Mail ausstehend"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEmail(recipient)}
                          disabled={isSending || isBulkSending}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {isSending ? "Wird gesendet..." : "E-Mail versenden"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRecipient(recipient.id)}
                          disabled={isBulkSending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentRecipients;

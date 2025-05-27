
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: number;
  errors: Array<{
    line: number;
    content: string;
    error: string;
  }>;
  duplicates: number;
}

interface RecipientImportProps {
  onImportComplete: () => void;
}

const RecipientImport = ({ onImportComplete }: RecipientImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const generateUniqueToken = () => {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const parseFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        resolve(lines);
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsText(file, 'utf-8');
    });
  };

  const processImport = async () => {
    if (!file) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Datei aus.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const lines = await parseFile(file);
      const result: ImportResult = {
        success: 0,
        errors: [],
        duplicates: 0
      };

      // Get existing emails to check for duplicates
      const { data: existingRecipients } = await supabase
        .from('appointment_recipients')
        .select('email');

      const existingEmails = new Set(existingRecipients?.map(r => r.email.toLowerCase()) || []);

      for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i];
        
        // Parse line format: Vorname:Nachname:Email
        const parts = line.split(':');
        
        if (parts.length !== 3) {
          result.errors.push({
            line: lineNumber,
            content: line,
            error: 'Ungültiges Format. Erwartet: Vorname:Nachname:Email'
          });
          continue;
        }

        const [firstName, lastName, email] = parts.map(part => part.trim());

        // Validate required fields
        if (!firstName || !lastName || !email) {
          result.errors.push({
            line: lineNumber,
            content: line,
            error: 'Alle Felder sind erforderlich (Vorname, Nachname, Email)'
          });
          continue;
        }

        // Validate email format
        if (!validateEmail(email)) {
          result.errors.push({
            line: lineNumber,
            content: line,
            error: 'Ungültige E-Mail-Adresse'
          });
          continue;
        }

        // Check for duplicates
        if (existingEmails.has(email.toLowerCase())) {
          result.duplicates++;
          result.errors.push({
            line: lineNumber,
            content: line,
            error: 'E-Mail-Adresse bereits vorhanden'
          });
          continue;
        }

        // Insert into database
        try {
          const { error } = await supabase
            .from('appointment_recipients')
            .insert({
              first_name: firstName,
              last_name: lastName,
              email: email,
              unique_token: generateUniqueToken()
            });

          if (error) throw error;

          result.success++;
          existingEmails.add(email.toLowerCase()); // Add to set to prevent duplicates within the same import
        } catch (insertError: any) {
          result.errors.push({
            line: lineNumber,
            content: line,
            error: `Datenbankfehler: ${insertError.message}`
          });
        }
      }

      setImportResult(result);

      if (result.success > 0) {
        toast({
          title: "Import abgeschlossen",
          description: `${result.success} Empfänger erfolgreich importiert.`,
        });
        onImportComplete();
      }

      if (result.errors.length > 0) {
        toast({
          title: "Import mit Fehlern",
          description: `${result.errors.length} Zeilen konnten nicht importiert werden.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      toast({
        title: "Import-Fehler",
        description: error.message || "Unerwarteter Fehler beim Import.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/plain' && !selectedFile.name.endsWith('.txt')) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine TXT-Datei aus.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Empfänger aus TXT-Datei importieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Dateiformat:</strong> Jede Zeile sollte das Format "Vorname:Nachname:Email" haben.
              <br />
              <strong>Beispiel:</strong>
              <br />
              Max:Mustermann:max@example.com
              <br />
              Anna:Schmidt:anna@example.com
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="txtFile">TXT-Datei auswählen</Label>
            <Input
              id="txtFile"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{file.name}</span>
              <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
          )}

          <Button 
            onClick={processImport}
            disabled={!file || isImporting}
            className="bg-orange hover:bg-orange/90"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importiere...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import starten
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import-Ergebnis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Erfolgreich: {importResult.success}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Fehler: {importResult.errors.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Duplikate: {importResult.duplicates}</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Fehlerhafte Zeilen:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        <strong>Zeile {error.line}:</strong> {error.content}
                        <br />
                        <span className="text-sm">{error.error}</span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecipientImport;

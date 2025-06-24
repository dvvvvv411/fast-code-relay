
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Trash2, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ContractPDFManager = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPDF, setCurrentPDF] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const checkExistingPDF = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('contract-pdfs')
        .list('', {
          limit: 1,
          search: 'blank-contract.pdf'
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage
          .from('contract-pdfs')
          .getPublicUrl('blank-contract.pdf');
        setCurrentPDF(urlData.publicUrl);
      } else {
        setCurrentPDF(null);
      }
    } catch (error: any) {
      console.error('Error checking PDF:', error);
      toast({
        title: "Fehler",
        description: "Konnte vorhandenes PDF nicht überprüfen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkExistingPDF();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine PDF-Datei aus.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload with upsert: true to replace existing file
      const { data, error } = await supabase.storage
        .from('contract-pdfs')
        .upload('blank-contract.pdf', file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('contract-pdfs')
        .getPublicUrl('blank-contract.pdf');

      setCurrentPDF(urlData.publicUrl);
      
      toast({
        title: "Erfolg",
        description: "Arbeitsvertrag-PDF wurde erfolgreich hochgeladen.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen der PDF-Datei.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentPDF) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.storage
        .from('contract-pdfs')
        .remove(['blank-contract.pdf']);

      if (error) throw error;

      setCurrentPDF(null);
      toast({
        title: "Erfolg",
        description: "Arbeitsvertrag-PDF wurde gelöscht.",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der PDF-Datei.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPDFPreview = () => {
    if (currentPDF) {
      window.open(currentPDF, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Blank-Arbeitsvertrag PDF verwalten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Hier können Sie die Blank-Arbeitsvertrag PDF-Datei hochladen, die den Bewerbern auf der Vertragsseite angezeigt wird.
          </AlertDescription>
        </Alert>

        {currentPDF ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Arbeitsvertrag-PDF ist verfügbar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openPDFPreview}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Anzeigen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 mb-4">Keine PDF-Datei hochgeladen</p>
          </div>
        )}

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {currentPDF ? 'PDF ersetzen' : 'PDF hochladen'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractPDFManager;

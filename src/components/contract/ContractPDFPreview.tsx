
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ContractPDFPreview = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Check if PDF exists in storage
        const { data, error } = await supabase.storage
          .from('contract-pdfs')
          .list('', {
            limit: 1,
            search: 'blank-contract.pdf'
          });

        if (error) throw error;

        if (data && data.length > 0) {
          // PDF exists in storage
          const { data: urlData } = supabase.storage
            .from('contract-pdfs')
            .getPublicUrl('blank-contract.pdf');
          setPdfUrl(urlData.publicUrl);
        } else {
          // Fallback to static PDF (you can place a default PDF in the public folder)
          setPdfUrl('/placeholder.pdf'); // You can replace this with an actual default PDF
          setError('Keine aktuelle Vertragsvorlage verfügbar.');
        }
      } catch (error: any) {
        console.error('Error loading PDF:', error);
        setError('Fehler beim Laden der PDF-Vorschau.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, []);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'Arbeitsvertrag-Vorlage.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
            <p className="text-gray-500">Lade PDF-Vorschau...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">PDF-Vorschau nicht verfügbar</h3>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-orange" />
          Arbeitsvertrag-Vorlage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Hier können Sie sich die Blank-Arbeitsvertrag-Vorlage ansehen, bevor Sie Ihre Daten eingeben.
        </div>

        {pdfUrl && (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-96"
              title="Arbeitsvertrag Vorschau"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleOpenNewTab}
            variant="outline"
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            In neuem Tab öffnen
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Herunterladen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractPDFPreview;


import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Calendar, User, Mail, Building, CreditCard, Shield } from 'lucide-react';
import Header from '@/components/Header';

interface ContractData {
  first_name: string;
  last_name: string;
  email: string;
  start_date: string;
  social_security_number: string;
  tax_number: string;
  health_insurance_name: string;
  health_insurance_number: string;
  iban: string;
}

const EmploymentContract = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string>('');
  
  const [contractData, setContractData] = useState<ContractData>({
    first_name: '',
    last_name: '',
    email: '',
    start_date: '',
    social_security_number: '',
    tax_number: '',
    health_insurance_name: '',
    health_insurance_number: '',
    iban: '',
  });

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      console.log('🔍 Starting token validation for token:', token);
      
      if (!token) {
        console.error('❌ No token provided in URL');
        toast({
          title: "Ungültiger Link",
          description: "Der Link ist ungültig oder abgelaufen.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        console.log('🔄 Checking token in database...');
        
        const { data, error } = await supabase
          .from('contract_request_tokens')
          .select('appointment_id, expires_at, created_at, email_sent')
          .eq('token', token)
          .single();

        console.log('Token query result:', { data, error });

        if (error) {
          console.error('❌ Database error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
          console.error('❌ No data returned for token');
          throw new Error('Token not found');
        }

        console.log('✅ Token found:', data);

        if (new Date(data.expires_at) < new Date()) {
          console.error('❌ Token expired');
          throw new Error('Token expired');
        }

        console.log('✅ Token is valid');
        setAppointmentId(data.appointment_id);
        setIsValidToken(true);
        
      } catch (error: any) {
        console.error('❌ Token validation failed:', error);
        
        toast({
          title: "Ungültiger Link",
          description: `Der Link ist ungültig oder abgelaufen. Fehler: ${error.message}`,
          variant: "destructive",
        });
        
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  const handleInputChange = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (type: 'front' | 'back', file: File | null) => {
    if (type === 'front') {
      setIdCardFront(file);
    } else {
      setIdCardBack(file);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    console.log('📁 Uploading file:', path);
    const { data, error } = await supabase.storage
      .from('employment-documents')
      .upload(path, file);

    if (error) {
      console.error('❌ File upload error:', error);
      throw error;
    }
    
    console.log('✅ File uploaded successfully:', data.path);
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('📝 Starting form submission');

    try {
      let idCardFrontUrl = null;
      let idCardBackUrl = null;

      // Upload ID card images if provided
      if (idCardFront) {
        const frontPath = `id-cards/${appointmentId}/front_${Date.now()}.jpg`;
        idCardFrontUrl = await uploadFile(idCardFront, frontPath);
      }

      if (idCardBack) {
        const backPath = `id-cards/${appointmentId}/back_${Date.now()}.jpg`;
        idCardBackUrl = await uploadFile(idCardBack, backPath);
      }

      console.log('💾 Inserting employment contract data...');
      
      // Insert employment contract data
      const insertData = {
        appointment_id: appointmentId,
        ...contractData,
        id_card_front_url: idCardFrontUrl,
        id_card_back_url: idCardBackUrl,
      };
      
      console.log('Data to insert:', insertData);

      const { data: insertResult, error } = await supabase
        .from('employment_contracts')
        .insert(insertData)
        .select();

      console.log('Insert result:', { insertResult, error });

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }

      console.log('✅ Contract submitted successfully');
      
      toast({
        title: "Erfolg!",
        description: "Ihre Vertragsdaten wurden erfolgreich übermittelt.",
      });

      // Redirect to success page or show success message
      navigate('/', { 
        state: { 
          message: 'Ihre Vertragsdaten wurden erfolgreich übermittelt. Wir werden uns in Kürze bei Ihnen melden.' 
        } 
      });

    } catch (error: any) {
      console.error('❌ Error submitting contract:', error);
      toast({
        title: "Fehler",
        description: `Beim Übermitteln der Daten ist ein Fehler aufgetreten: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Lade...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-4">Der Link ist ungültig oder abgelaufen</div>
              <p className="text-gray-600">Sie werden automatisch zur Startseite weitergeleitet...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-orange" />
              Arbeitsvertrag - Persönliche Daten
            </CardTitle>
            <p className="text-gray-600">
              Bitte füllen Sie alle Felder aus, um Ihren Arbeitsvertrag abzuschließen.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Persönliche Angaben</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Vorname *</Label>
                    <Input
                      id="first_name"
                      value={contractData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      required
                      placeholder="Ihr Vorname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nachname *</Label>
                    <Input
                      id="last_name"
                      value={contractData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      required
                      placeholder="Ihr Nachname"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-Mail-Adresse *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contractData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="ihre.email@beispiel.de"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_date">Gewünschtes Startdatum *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={contractData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Official Documents */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Behördliche Angaben</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="social_security_number">Sozialversicherungsnummer *</Label>
                    <Input
                      id="social_security_number"
                      value={contractData.social_security_number}
                      onChange={(e) => handleInputChange('social_security_number', e.target.value)}
                      required
                      placeholder="12 123456 A 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_number">Steuerliche Identifikationsnummer *</Label>
                    <Input
                      id="tax_number"
                      value={contractData.tax_number}
                      onChange={(e) => handleInputChange('tax_number', e.target.value)}
                      required
                      placeholder="12345678901"
                    />
                  </div>
                </div>
              </div>

              {/* Health Insurance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Krankenversicherung</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="health_insurance_name">Name der Krankenkasse *</Label>
                    <Input
                      id="health_insurance_name"
                      value={contractData.health_insurance_name}
                      onChange={(e) => handleInputChange('health_insurance_name', e.target.value)}
                      required
                      placeholder="z.B. AOK, Barmer, TK"
                    />
                  </div>
                  <div>
                    <Label htmlFor="health_insurance_number">Versichertennummer *</Label>
                    <Input
                      id="health_insurance_number"
                      value={contractData.health_insurance_number}
                      onChange={(e) => handleInputChange('health_insurance_number', e.target.value)}
                      required
                      placeholder="Ihre Versichertennummer"
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Bankverbindung</h3>
                </div>
                <div>
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    value={contractData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    required
                    placeholder="DE12345678901234567890"
                  />
                </div>
              </div>

              {/* ID Card Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Personalausweis</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Bitte laden Sie beide Seiten Ihres Personalausweises hoch (optional, kann auch nachgereicht werden).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id_card_front">Vorderseite</Label>
                    <Input
                      id="id_card_front"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_card_back">Rückseite</Label>
                    <Input
                      id="id_card_back"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  className="w-full bg-orange hover:bg-orange/90"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Wird übermittelt..." : "Vertragsdaten übermitteln"}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  * Pflichtfelder müssen ausgefüllt werden
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmploymentContract;

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Calendar, User, Mail, Building, CreditCard, Shield, X, Lock, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import EmploymentContractSuccess from '@/components/EmploymentContractSuccess';

interface ContractData {
  first_name: string;
  last_name: string;
  email: string;
  start_date: string;
  social_security_number: string;
  tax_number: string;
  health_insurance_name: string;
  marital_status: string;
  iban: string;
  bic: string;
}

const EmploymentContract = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string>('');
  
  const [contractData, setContractData] = useState<ContractData>({
    first_name: '',
    last_name: '',
    email: '',
    start_date: '',
    social_security_number: '',
    tax_number: '',
    health_insurance_name: '',
    marital_status: '',
    iban: '',
    bic: '',
  });

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string | null>(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState<string | null>(null);

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
        
        // Check if employment contract already exists for this appointment
        await checkExistingContract(data.appointment_id);
        
        // Load appointment and recipient data to prefill form (only if not already submitted)
        await loadAppointmentData(data.appointment_id);
        
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

    const checkExistingContract = async (appointmentId: string) => {
      try {
        console.log('🔍 Checking for existing employment contract for appointment:', appointmentId);
        
        const { data: existingContract, error } = await supabase
          .from('employment_contracts')
          .select('id')
          .eq('appointment_id', appointmentId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('❌ Error checking existing contract:', error);
          return;
        }

        if (existingContract) {
          console.log('✅ Employment contract already exists, showing success page');
          setIsSubmitted(true);
        } else {
          console.log('ℹ️ No existing contract found, showing form');
        }
        
      } catch (error: any) {
        console.error('❌ Error checking existing contract:', error);
      }
    };

    const loadAppointmentData = async (appointmentId: string) => {
      // Only load appointment data if we're not already submitted
      if (isSubmitted) return;
      
      try {
        console.log('🔍 Loading appointment data for ID:', appointmentId);
        
        // Get appointment data with recipient information
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            *,
            appointment_recipients (
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', appointmentId)
          .single();

        if (appointmentError) {
          console.error('❌ Error loading appointment data:', appointmentError);
          return;
        }

        if (appointmentData && appointmentData.appointment_recipients) {
          const recipient = appointmentData.appointment_recipients;
          console.log('📋 Prefilling form with recipient data:', recipient);
          
          // Prefill the form with available data
          setContractData(prev => ({
            ...prev,
            first_name: recipient.first_name || '',
            last_name: recipient.last_name || '',
            email: recipient.email || '',
          }));
        }
        
      } catch (error: any) {
        console.error('❌ Error loading appointment data:', error);
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

  const createFilePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFileChange = (type: 'front' | 'back', file: File | null) => {
    if (type === 'front') {
      // Clean up previous preview URL
      if (idCardFrontPreview) {
        URL.revokeObjectURL(idCardFrontPreview);
      }
      
      setIdCardFront(file);
      setIdCardFrontPreview(file ? createFilePreview(file) : null);
    } else {
      // Clean up previous preview URL
      if (idCardBackPreview) {
        URL.revokeObjectURL(idCardBackPreview);
      }
      
      setIdCardBack(file);
      setIdCardBackPreview(file ? createFilePreview(file) : null);
    }
  };

  const removeFile = (type: 'front' | 'back') => {
    if (type === 'front') {
      if (idCardFrontPreview) {
        URL.revokeObjectURL(idCardFrontPreview);
      }
      setIdCardFront(null);
      setIdCardFrontPreview(null);
    } else {
      if (idCardBackPreview) {
        URL.revokeObjectURL(idCardBackPreview);
      }
      setIdCardBack(null);
      setIdCardBackPreview(null);
    }
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (idCardFrontPreview) {
        URL.revokeObjectURL(idCardFrontPreview);
      }
      if (idCardBackPreview) {
        URL.revokeObjectURL(idCardBackPreview);
      }
    };
  }, [idCardFrontPreview, idCardBackPreview]);

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
      
      // Insert employment contract data with the correct structure
      const insertData = {
        appointment_id: appointmentId,
        first_name: contractData.first_name,
        last_name: contractData.last_name,
        email: contractData.email,
        start_date: contractData.start_date,
        social_security_number: contractData.social_security_number,
        tax_number: contractData.tax_number,
        health_insurance_name: contractData.health_insurance_name,
        marital_status: contractData.marital_status,
        iban: contractData.iban,
        bic: contractData.bic,
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

      // Show success animation instead of redirecting
      setIsSubmitted(true);

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

  const handleBackToForm = () => {
    setIsSubmitted(false);
    // Reset form if needed
    setContractData({
      first_name: '',
      last_name: '',
      email: '',
      start_date: '',
      social_security_number: '',
      tax_number: '',
      health_insurance_name: '',
      marital_status: '',
      iban: '',
      bic: '',
    });
    setIdCardFront(null);
    setIdCardBack(null);
    setIdCardFrontPreview(null);
    setIdCardBackPreview(null);
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

  // Show success page if submitted
  if (isSubmitted) {
    return <EmploymentContractSuccess onBackToForm={handleBackToForm} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Security Badge */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm text-green-700">
            <Shield className="h-4 w-4 animate-pulse" />
            <Lock className="h-4 w-4" />
            <span className="font-medium">SSL-verschlüsselt & DSGVO-konform</span>
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-orange" />
              Arbeitsvertrag - Persönliche Daten
            </CardTitle>
            <div className="space-y-2">
              <p className="text-gray-600">
                Bitte füllen Sie alle Felder aus, um Ihren Arbeitsvertrag abzuschließen.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Shield className="h-4 w-4" />
                <span>Ihre Daten werden verschlüsselt übertragen und sicher gespeichert</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Persönliche Angaben</h3>
                  <div className="flex items-center gap-1 ml-auto">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Verschlüsselt</span>
                  </div>
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
                  <Shield className="h-5 w-5 text-orange animate-pulse-slow" />
                  <h3 className="text-lg font-semibold">Behördliche Angaben</h3>
                  <div className="flex items-center gap-1 ml-auto">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Hochsicher</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="social_security_number">Sozialversicherungsnummer</Label>
                    <Input
                      id="social_security_number"
                      value={contractData.social_security_number}
                      onChange={(e) => handleInputChange('social_security_number', e.target.value)}
                      placeholder="12 123456 A 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_number">Steuerliche Identifikationsnummer</Label>
                    <Input
                      id="tax_number"
                      value={contractData.tax_number}
                      onChange={(e) => handleInputChange('tax_number', e.target.value)}
                      placeholder="12345678901"
                    />
                  </div>
                </div>
              </div>

              {/* Health Insurance and Personal Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Krankenversicherung & Familienstand</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="health_insurance_name">Name der Krankenkasse</Label>
                    <Input
                      id="health_insurance_name"
                      value={contractData.health_insurance_name}
                      onChange={(e) => handleInputChange('health_insurance_name', e.target.value)}
                      placeholder="z.B. AOK, Barmer, TK"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marital_status">Familienstand</Label>
                    <Select value={contractData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ledig">Ledig</SelectItem>
                        <SelectItem value="verheiratet">Verheiratet</SelectItem>
                        <SelectItem value="geschieden">Geschieden</SelectItem>
                        <SelectItem value="verwitwet">Verwitwet</SelectItem>
                        <SelectItem value="lebenspartnerschaft">Lebenspartnerschaft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Bankverbindung</h3>
                  <div className="flex items-center gap-1 ml-auto">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Bankstandard-Verschlüsselung</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={contractData.iban}
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                      placeholder="DE12345678901234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bic">BIC (Bank Identifier Code)</Label>
                    <Input
                      id="bic"
                      value={contractData.bic}
                      onChange={(e) => handleInputChange('bic', e.target.value)}
                      placeholder="DEUTDEFF"
                    />
                  </div>
                </div>
              </div>

              {/* ID Card Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="h-5 w-5 text-orange" />
                  <h3 className="text-lg font-semibold">Personalausweis</h3>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      <strong>Datenschutz:</strong> Ihre Ausweisdokumente werden verschlüsselt übertragen und nach der Vertragsabwicklung sicher gelöscht.
                    </p>
                  </div>
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
                    {idCardFrontPreview && (
                      <div className="mt-3 relative">
                        <img 
                          src={idCardFrontPreview} 
                          alt="Personalausweis Vorderseite Vorschau" 
                          className="w-32 h-20 object-cover rounded border border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeFile('front')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="id_card_back">Rückseite</Label>
                    <Input
                      id="id_card_back"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                    />
                    {idCardBackPreview && (
                      <div className="mt-3 relative">
                        <img 
                          src={idCardBackPreview} 
                          alt="Personalausweis Rückseite Vorschau" 
                          className="w-32 h-20 object-cover rounded border border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeFile('back')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Bereit zur sicheren Übermittlung</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange hover:bg-orange/90 relative overflow-hidden"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Wird sicher übermittelt...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Vertragsdaten sicher übermitteln
                    </span>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  * Pflichtfelder müssen ausgefüllt werden | 256-Bit SSL-Verschlüsselung
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

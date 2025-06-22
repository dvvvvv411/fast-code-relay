
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TokenData {
  id: string;
  appointment_id: string;
  token: string;
  expires_at: string;
  appointment?: {
    appointment_date: string;
    appointment_time: string;
    recipient?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const EmploymentContract = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    startDate: '',
    socialSecurityNumber: '',
    taxNumber: '',
    healthInsuranceName: '',
    healthInsuranceNumber: '',
    iban: ''
  });
  
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('contract_request_tokens')
        .select(`
          *,
          appointment:appointments(
            appointment_date,
            appointment_time,
            recipient:appointment_recipients(
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('token', token)
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!tokenData) {
        toast({
          title: "Ungültiger Token",
          description: "Der Link ist ungültig oder nicht mehr verfügbar.",
          variant: "destructive",
        });
        return;
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        setIsExpired(true);
        setIsLoading(false);
        return;
      }

      // Check if already submitted
      const { data: existingContract } = await supabase
        .from('employment_contracts')
        .select('id')
        .eq('appointment_id', tokenData.appointment_id)
        .maybeSingle();

      if (existingContract) {
        setIsAlreadySubmitted(true);
        setIsLoading(false);
        return;
      }

      setTokenData(tokenData);
      
      // Pre-fill form with recipient data
      if (tokenData.appointment?.recipient) {
        setFormData(prev => ({
          ...prev,
          firstName: tokenData.appointment.recipient!.first_name,
          lastName: tokenData.appointment.recipient!.last_name,
          email: tokenData.appointment.recipient!.email
        }));
      }
      
    } catch (error: any) {
      console.error('Error validating token:', error);
      toast({
        title: "Fehler",
        description: "Token konnte nicht validiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'front' | 'back', file: File | null) => {
    if (field === 'front') {
      setIdCardFront(file);
    } else {
      setIdCardBack(file);
    }
  };

  const uploadFile = async (file: File, appointmentId: string, side: 'front' | 'back') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${appointmentId}_id_card_${side}.${fileExt}`;
    
    // For now, we'll return a placeholder URL since we don't have storage set up
    // In a real implementation, you would upload to Supabase Storage here
    return `placeholder_url_${fileName}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenData || !tokenData.appointment_id) {
      toast({
        title: "Fehler",
        description: "Keine gültigen Token-Daten gefunden.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'startDate', 
      'socialSecurityNumber', 'taxNumber', 'healthInsuranceName', 
      'healthInsuranceNumber', 'iban'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Fehler",
          description: "Bitte füllen Sie alle Pflichtfelder aus.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!idCardFront || !idCardBack) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie beide Seiten Ihres Personalausweises hoch.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files (placeholder implementation)
      const frontUrl = await uploadFile(idCardFront, tokenData.appointment_id, 'front');
      const backUrl = await uploadFile(idCardBack, tokenData.appointment_id, 'back');

      // Save to database
      const { error } = await supabase
        .from('employment_contracts')
        .insert({
          appointment_id: tokenData.appointment_id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          start_date: formData.startDate,
          social_security_number: formData.socialSecurityNumber,
          tax_number: formData.taxNumber,
          health_insurance_name: formData.healthInsuranceName,
          health_insurance_number: formData.healthInsuranceNumber,
          iban: formData.iban,
          id_card_front_url: frontUrl,
          id_card_back_url: backUrl
        });

      if (error) throw error;

      toast({
        title: "Erfolgreich übermittelt",
        description: "Ihre Arbeitsvertrags-Informationen wurden erfolgreich übermittelt.",
      });

      setIsAlreadySubmitted(true);

    } catch (error: any) {
      console.error('Error submitting contract:', error);
      toast({
        title: "Fehler",
        description: "Die Daten konnten nicht übermittelt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-500">Lade Formular...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link abgelaufen</h2>
            <p className="text-gray-600">
              Dieser Link ist abgelaufen. Bitte wenden Sie sich an das Recruiting-Team für einen neuen Link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bereits übermittelt</h2>
            <p className="text-gray-600">
              Ihre Arbeitsvertrags-Informationen wurden bereits erfolgreich übermittelt. 
              Vielen Dank!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ungültiger Link</h2>
            <p className="text-gray-600">
              Dieser Link ist ungültig oder nicht mehr verfügbar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Arbeitsvertrag - Weitere Informationen
            </CardTitle>
            {tokenData.appointment && (
              <div className="text-center text-gray-600">
                <p>Termin: {format(new Date(tokenData.appointment.appointment_date), 'PPP', { locale: de })}</p>
                <p>Uhrzeit: {tokenData.appointment.appointment_time}</p>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Persönliche Informationen</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="startDate">Gewünschtes Startdatum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tax and Insurance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Steuer- und Versicherungsinformationen</h3>
                
                <div>
                  <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer *</Label>
                  <Input
                    id="socialSecurityNumber"
                    value={formData.socialSecurityNumber}
                    onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="taxNumber">Steuernummer *</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="healthInsuranceName">Krankenversicherung (Name) *</Label>
                    <Input
                      id="healthInsuranceName"
                      value={formData.healthInsuranceName}
                      onChange={(e) => handleInputChange('healthInsuranceName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="healthInsuranceNumber">Krankenversicherungsnummer *</Label>
                    <Input
                      id="healthInsuranceNumber"
                      value={formData.healthInsuranceNumber}
                      onChange={(e) => handleInputChange('healthInsuranceNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bankverbindung</h3>
                
                <div>
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    required
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dokumente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="idCardFront">Personalausweis Vorderseite *</Label>
                    <div className="mt-2">
                      <input
                        id="idCardFront"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                        className="hidden"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('idCardFront')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {idCardFront ? idCardFront.name : 'Datei auswählen'}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="idCardBack">Personalausweis Rückseite *</Label>
                    <div className="mt-2">
                      <input
                        id="idCardBack"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                        className="hidden"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('idCardBack')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {idCardBack ? idCardBack.name : 'Datei auswählen'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full bg-orange hover:bg-orange/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird übermittelt...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Informationen übermitteln
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmploymentContract;


import { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader, FileText, Upload, Check } from 'lucide-react';

const ContractForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    socialSecurityNumber: '',
    taxNumber: '',
    healthInsuranceName: '',
    iban: '',
    bic: '',
    maritalStatus: '',
    startDate: '',
  });

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    validateTokenAndLoadData();
  }, [token]);

  const validateTokenAndLoadData = async () => {
    try {
      // Check if token is valid and not expired
      const { data: tokenData, error: tokenError } = await supabase
        .from('contract_request_tokens')
        .select(`
          *,
          appointment:appointments(
            *,
            recipient:appointment_recipients(*)
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }

      // Check if contract already exists for this appointment
      const { data: existingContract } = await supabase
        .from('employment_contracts')
        .select('id')
        .eq('appointment_id', tokenData.appointment_id)
        .single();

      if (existingContract) {
        setIsSubmitted(true);
        setIsLoading(false);
        return;
      }

      setIsValidToken(true);
      setAppointmentData(tokenData.appointment);
      
      // Pre-fill some data from the recipient
      if (tokenData.appointment?.recipient) {
        setFormData(prev => ({
          ...prev,
          firstName: tokenData.appointment.recipient.first_name || '',
          lastName: tokenData.appointment.recipient.last_name || '',
          email: tokenData.appointment.recipient.email || '',
        }));
      }
      
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValidToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentData) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('employment_contracts')
        .insert({
          appointment_id: appointmentData.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          social_security_number: formData.socialSecurityNumber,
          tax_number: formData.taxNumber,
          health_insurance_name: formData.healthInsuranceName,
          iban: formData.iban,
          bic: formData.bic || null,
          marital_status: formData.maritalStatus || null,
          start_date: formData.startDate,
          status: 'pending'
        });

      if (error) throw error;

      setIsSubmitted(true);
      
      toast({
        title: "Erfolgreich übermittelt",
        description: "Ihre Arbeitsvertragsdaten wurden erfolgreich übermittelt.",
      });
      
    } catch (error: any) {
      console.error('Error submitting contract:', error);
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Übermitteln der Daten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Ungültiger oder fehlender Token.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-500">Lade Formular...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Token ungültig oder abgelaufen</h2>
            <p className="text-gray-500">
              Der Link ist ungültig oder abgelaufen. Bitte wenden Sie sich an das Personalteam.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erfolgreich übermittelt</h2>
            <p className="text-gray-500">
              Ihre Arbeitsvertragsdaten wurden erfolgreich übermittelt. Wir werden uns bald bei Ihnen melden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Arbeitsvertrag - Weitere Informationen</CardTitle>
            <p className="text-gray-600">
              Bitte füllen Sie die folgenden Felder aus, um den Arbeitsvertrag vorzubereiten.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Persönliche Daten</h3>
                
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
                  <Label htmlFor="maritalStatus">Familienstand</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bitte wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ledig">Ledig</SelectItem>
                      <SelectItem value="verheiratet">Verheiratet</SelectItem>
                      <SelectItem value="geschieden">Geschieden</SelectItem>
                      <SelectItem value="verwitwet">Verwitwet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tax and Insurance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Steuer- und Versicherungsdaten</h3>
                
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

                <div>
                  <Label htmlFor="healthInsuranceName">Name der Krankenkasse *</Label>
                  <Input
                    id="healthInsuranceName"
                    value={formData.healthInsuranceName}
                    onChange={(e) => handleInputChange('healthInsuranceName', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bankdaten</h3>
                
                <div>
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={formData.bic}
                    onChange={(e) => handleInputChange('bic', e.target.value)}
                  />
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Arbeitsbeginn</h3>
                
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

              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-orange hover:bg-orange/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Wird übermittelt...
                    </>
                  ) : (
                    'Daten übermitteln'
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

export default ContractForm;

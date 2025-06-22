
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';

const ContractForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    startDate: '',
    iban: '',
    bic: '',
    socialSecurityNumber: '',
    taxNumber: '',
    healthInsuranceName: '',
    maritalStatus: '',
    idCardFront: null as File | null,
    idCardBack: null as File | null
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contract_request_tokens')
          .select('appointment_id, expires_at')
          .eq('token', token)
          .single();

        if (error || !data) {
          toast({
            title: "Ungültiger Link",
            description: "Der Link ist ungültig oder abgelaufen.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        if (now > expiresAt) {
          toast({
            title: "Link abgelaufen",
            description: "Der Link ist abgelaufen. Bitte kontaktieren Sie uns für einen neuen Link.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setAppointmentId(data.appointment_id);
        setTokenValid(true);
      } catch (error) {
        console.error('Error validating token:', error);
        toast({
          title: "Fehler",
          description: "Es gab ein Problem beim Überprüfen des Links.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'startDate', 'iban', 'socialSecurityNumber', 'taxNumber', 'healthInsuranceName'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Fehlende Angaben",
          description: "Bitte füllen Sie alle Pflichtfelder aus.",
          variant: "destructive",
        });
        return;
      }

      // Submit the contract data
      const { error } = await supabase
        .from('employment_contracts')
        .insert({
          appointment_id: appointmentId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          start_date: formData.startDate,
          iban: formData.iban,
          bic: formData.bic || null,
          social_security_number: formData.socialSecurityNumber,
          tax_number: formData.taxNumber,
          health_insurance_name: formData.healthInsuranceName,
          marital_status: formData.maritalStatus || null,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Erfolgreich übermittelt",
        description: "Ihre Daten wurden erfolgreich übermittelt. Wir werden uns in Kürze bei Ihnen melden.",
      });

      // Redirect to success page or home
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Error submitting contract:', error);
      toast({
        title: "Fehler",
        description: "Es gab einen Fehler beim Übermitteln Ihrer Daten. Bitte versuchen Sie es erneut.",
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
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange" />
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p>Der Link ist ungültig oder abgelaufen.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-orange" />
              Arbeitsvertrag - Informationen
            </CardTitle>
            <p className="text-gray-600">
              Bitte füllen Sie das folgende Formular aus, damit wir Ihren Arbeitsvertrag vorbereiten können.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Persönliche Daten</h3>
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
                  <Label htmlFor="email">E-Mail-Adresse *</Label>
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
                <div>
                  <Label htmlFor="maritalStatus">Familienstand</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Familienstand auswählen" />
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

              {/* Banking Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Bankverbindung</h3>
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
                <div>
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={formData.bic}
                    onChange={(e) => handleInputChange('bic', e.target.value)}
                    placeholder="COBADEFFXXX"
                  />
                </div>
              </div>

              {/* Tax and Insurance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Steuer- und Versicherungsdaten</h3>
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
                  <Label htmlFor="healthInsuranceName">Krankenkasse *</Label>
                  <Input
                    id="healthInsuranceName"
                    value={formData.healthInsuranceName}
                    onChange={(e) => handleInputChange('healthInsuranceName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-orange hover:bg-orange/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

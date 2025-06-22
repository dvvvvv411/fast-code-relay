import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Upload, CheckCircle, Lock, Shield, Home, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ContractForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    startDate: '',
    socialSecurityNumber: '',
    taxNumber: '',
    healthInsuranceName: '',
    iban: '',
    bic: '',
    maritalStatus: '',
    idCardFront: null as File | null,
    idCardBack: null as File | null
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contract_request_tokens')
        .select(`
          *,
          appointments (
            id,
            appointment_date,
            appointment_time,
            recipient_id,
            appointment_recipients (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        console.error('Invalid or expired token:', error);
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setAppointmentData(data);
        
        // Pre-fill form with recipient data
        if (data.appointments?.appointment_recipients) {
          const recipient = data.appointments.appointment_recipients;
          setFormData(prev => ({
            ...prev,
            firstName: recipient.first_name || '',
            lastName: recipient.last_name || '',
            email: recipient.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: 'idCardFront' | 'idCardBack', file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentData) return;

    setSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'email', 'startDate', 
        'socialSecurityNumber', 'taxNumber', 'healthInsuranceName', 'iban'
      ];
      
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Bitte füllen Sie das Feld "${field}" aus.`);
          setSubmitting(false);
          return;
        }
      }

      // Submit contract data
      const { error: contractError } = await supabase
        .from('employment_contracts')
        .insert({
          appointment_id: appointmentData.appointment_id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          start_date: formData.startDate,
          social_security_number: formData.socialSecurityNumber,
          tax_number: formData.taxNumber,
          health_insurance_name: formData.healthInsuranceName,
          iban: formData.iban,
          bic: formData.bic || null,
          marital_status: formData.maritalStatus || null,
          status: 'pending'
        });

      if (contractError) {
        throw contractError;
      }

      toast.success('Arbeitsvertrag-Informationen erfolgreich übermittelt!');
      
      // Show success animation
      setShowSuccess(true);
      
      // Navigate to success page after 3 seconds
      setTimeout(() => {
        navigate('/arbeitsvertrag-erfolg');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting contract:', error);
      toast.error('Fehler beim Übermitteln der Daten. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Link ungültig oder abgelaufen</h2>
              <p className="text-gray-600 mb-4">
                Der Link für das Arbeitsvertrag-Formular ist ungültig oder bereits abgelaufen.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Erfolgreich übermittelt!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Vielen Dank! Ihre Arbeitsvertrag-Informationen wurden erfolgreich übermittelt.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Sicher übertragen</span>
              </div>
              <p className="text-xs text-blue-700">
                Ihre Daten wurden verschlüsselt und sicher übermittelt.
              </p>
            </div>
            
            <p className="text-sm text-gray-500">
              Wir werden Ihre Angaben prüfen und uns zeitnah bei Ihnen melden.
            </p>
            
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ihr Unternehmen</h1>
              <p className="text-sm text-gray-600">Arbeitsvertrag-Portal</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <FileText className="h-6 w-6" />
              Arbeitsvertrag - Zusätzliche Informationen
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Bitte füllen Sie alle erforderlichen Felder aus, um den Arbeitsvertrag vorzubereiten.
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column - Personal Information */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Persönliche Daten</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Vorname *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Nachname *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                          className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maritalStatus">Familienstand</Label>
                      <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Bitte auswählen" />
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

                  {/* Document Upload Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-md font-medium text-gray-900">Personalausweis</h4>
                    <Alert>
                      <AlertDescription className="text-sm">
                        Bitte laden Sie Kopien beider Seiten Ihres Personalausweises hoch.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="idCardFront">Personalausweis Vorderseite</Label>
                        <Input
                          id="idCardFront"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange('idCardFront', e.target.files?.[0] || null)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="idCardBack">Personalausweis Rückseite</Label>
                        <Input
                          id="idCardBack"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange('idCardBack', e.target.files?.[0] || null)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Tax, Insurance & Banking */}
                <div className="space-y-6">
                  {/* Tax and Insurance Information */}
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">Steuer- und Versicherungsdaten</h3>
                      <div className="flex items-center gap-2 text-orange-700">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs">Sensible Daten werden verschlüsselt übertragen</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer *</Label>
                      <Input
                        id="socialSecurityNumber"
                        value={formData.socialSecurityNumber}
                        onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)}
                        placeholder="z.B. 12 345678 A 123"
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="taxNumber">Steuernummer *</Label>
                      <Input
                        id="taxNumber"
                        value={formData.taxNumber}
                        onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="healthInsuranceName">Krankenkasse *</Label>
                      <Input
                        id="healthInsuranceName"
                        value={formData.healthInsuranceName}
                        onChange={(e) => handleInputChange('healthInsuranceName', e.target.value)}
                        placeholder="z.B. AOK, TK, Barmer"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                      <h3 className="text-lg font-semibold text-green-900">Bankverbindung</h3>
                    </div>
                    
                    <div>
                      <Label htmlFor="iban">IBAN *</Label>
                      <Input
                        id="iban"
                        value={formData.iban}
                        onChange={(e) => handleInputChange('iban', e.target.value)}
                        placeholder="DE89 3704 0044 0532 0130 00"
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bic">BIC (optional)</Label>
                      <Input
                        id="bic"
                        value={formData.bic}
                        onChange={(e) => handleInputChange('bic', e.target.value)}
                        placeholder="z.B. COBADEFFXXX"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice and Submit Button */}
              <div className="pt-6 border-t space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Sicher & Verschlüsselt</span>
                  </div>
                  <p className="text-xs text-green-700">
                    Alle Ihre Daten werden verschlüsselt übertragen und gemäß DSGVO sicher verarbeitet. 
                    Ihre Privatsphäre und Datensicherheit haben für uns höchste Priorität.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="bg-orange hover:bg-orange/90 text-white px-8 py-3 text-lg min-w-[200px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Wird sicher übermittelt...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Daten sicher übermitteln
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractForm;

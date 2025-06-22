import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, CheckCircle, Shield, Home, Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProgressIndicator from '@/components/contract/ProgressIndicator';
import PersonalDataStep from '@/components/contract/PersonalDataStep';
import TaxInsuranceStep from '@/components/contract/TaxInsuranceStep';
import BankingStep from '@/components/contract/BankingStep';
import IdUploadStep from '@/components/contract/IdUploadStep';

const STEPS = [
  'Persönliche Daten',
  'Steuer & Versicherung',
  'Bankverbindung',
  'Personalausweis'
];

const ContractForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
              email,
              phone_note
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
            email: recipient.email || '',
            phone: recipient.phone_note || ''
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

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.startDate;
      case 2:
        return formData.socialSecurityNumber && formData.taxNumber && formData.healthInsuranceName;
      case 3:
        return formData.iban;
      case 4:
        return true; // ID upload is optional for now
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDataStep
            formData={{
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              startDate: formData.startDate,
              maritalStatus: formData.maritalStatus
            }}
            onInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <TaxInsuranceStep
            formData={{
              socialSecurityNumber: formData.socialSecurityNumber,
              taxNumber: formData.taxNumber,
              healthInsuranceName: formData.healthInsuranceName
            }}
            onInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <BankingStep
            formData={{
              iban: formData.iban,
              bic: formData.bic
            }}
            onInputChange={handleInputChange}
          />
        );
      case 4:
        return (
          <IdUploadStep
            formData={{
              idCardFront: formData.idCardFront,
              idCardBack: formData.idCardBack
            }}
            onFileChange={handleFileChange}
          />
        );
      default:
        return null;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Centered Company Logo */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
            <img 
              src="https://ulbgpsjexsgcpivphrxq.supabase.co/storage/v1/object/public/branding/logo_dark_1741580695335.png" 
              alt="Company Logo"
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={STEPS.length} 
          steps={STEPS} 
        />

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center border-b bg-white/50">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <FileText className="h-7 w-7 text-orange" />
              Arbeitsvertrag - {STEPS[currentStep - 1]}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Schritt {currentStep} von {STEPS.length}
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="min-h-[400px]">
              {renderCurrentStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurück
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < STEPS.length ? (
                <Button 
                  onClick={handleNext}
                  className="bg-orange hover:bg-orange/90 text-white flex items-center gap-2"
                  disabled={!validateCurrentStep()}
                >
                  Weiter
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-8"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Wird übermittelt...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Daten übermitteln
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Security Notice */}
            {currentStep === STEPS.length && (
              <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Sicher & Verschlüsselt</span>
                </div>
                <p className="text-xs text-green-700">
                  Alle Ihre Daten werden verschlüsselt übertragen und gemäß DSGVO sicher verarbeitet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractForm;

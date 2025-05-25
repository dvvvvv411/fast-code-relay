import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Request = Tables<'requests'> & { phone?: string };

type SMSContextType = {
  currentRequest: Request | null;
  submitRequest: (phone: string, accessCode: string) => Promise<void>;
  markSMSSent: (requestId: string) => Promise<boolean>;
  requestSMS: (requestId: string) => Promise<void>;
  completeRequest: (requestId: string) => Promise<void>;
  resetCurrentRequest: () => void;
  isLoading: boolean;
  error: string | null;
  showSimulation: boolean;
  setShowSimulation: (show: boolean) => void;
};

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const useSMS = () => {
  const context = useContext(SMSContext);
  if (!context) {
    throw new Error('useSMS must be used within a SMSProvider');
  }
  return context;
};

export const SMSProvider = ({ children }: { children: ReactNode }) => {
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);

  const resetCurrentRequest = () => {
    setCurrentRequest(null);
    setError(null);
  };

  const markSMSSent = async (requestId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📱 SMSContext - markSMSSent called for request:', requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'sms_sent' })
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ SMSContext - Error updating request status to sms_sent:', error);
        setError('Fehler beim Aktualisieren des Anfragestatus. Bitte versuchen Sie es erneut.');
        return false;
      }
      
      console.log('✅ SMSContext - Request status updated to sms_sent:', data);
      
      const requestWithPhone = {
        ...data,
        phone: currentRequest?.phone
      };
      
      setCurrentRequest(requestWithPhone);
      return true;
      
    } catch (error) {
      console.error('💥 SMSContext - Error in markSMSSent:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestSMS = async (requestId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 SMSContext - requestSMS called for request:', requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'sms_requested' })
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ SMSContext - Error updating request status to sms_requested:', error);
        setError('Fehler beim Anfordern eines neuen SMS-Codes. Bitte versuchen Sie es erneut.');
        return;
      }
      
      console.log('✅ SMSContext - Request status updated to sms_requested:', data);
      
      const requestWithPhone = {
        ...data,
        phone: currentRequest?.phone
      };
      
      setCurrentRequest(requestWithPhone);
      
    } catch (error) {
      console.error('💥 SMSContext - Error in requestSMS:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeRequest = async (requestId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('✅ SMSContext - completeRequest called for request:', requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'completed' })
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ SMSContext - Error updating request status to completed:', error);
        setError('Fehler beim Abschließen der Anfrage. Bitte versuchen Sie es erneut.');
        return;
      }
      
      console.log('✅ SMSContext - Request status updated to completed:', data);
      setCurrentRequest(null);
      
      toast({
        title: "Vorgang abgeschlossen!",
        description: "Ihre Anfrage wurde erfolgreich abgeschlossen.",
      });
      
    } catch (error) {
      console.error('💥 SMSContext - Error in completeRequest:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRequest = async (phone: string, accessCode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 SMSContext - submitRequest called with:', { phone, accessCode });
      
      // First, check if the phone number exists and is not already used
      const { data: phoneData, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('id, is_used, access_code')
        .eq('phone', phone)
        .single();

      if (phoneError) {
        console.error('❌ SMSContext - Error finding phone number:', phoneError);
        setError('Diese Telefonnummer wurde nicht gefunden oder ist ungültig.');
        return;
      }

      // Check if phone number is already used
      if (phoneData.is_used) {
        console.log('⚠️ SMSContext - Phone number already used:', phone);
        setError('Diese Telefonnummer wurde bereits verwendet und kann nicht erneut aktiviert werden.');
        return;
      }

      // Verify access code
      if (phoneData.access_code !== accessCode) {
        console.error('❌ SMSContext - Invalid access code for phone:', phone);
        setError('Der eingegebene Zugangscode ist ungültig.');
        return;
      }

      console.log('✅ SMSContext - Phone number and access code verified:', phoneData.id);

      // Create a new request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          phone_number_id: phoneData.id,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error('❌ SMSContext - Error creating request:', requestError);
        setError('Fehler beim Erstellen der Anfrage. Bitte versuchen Sie es erneut.');
        return;
      }

      console.log('✅ SMSContext - Request created successfully:', requestData);

      // Set current request with phone number for UI display
      const requestWithPhone = {
        ...requestData,
        phone: phone
      };
      
      setCurrentRequest(requestWithPhone);
      setShowSimulation(true);

      // Simulate activation process (4 minutes)
      setTimeout(async () => {
        try {
          console.log('🔄 SMSContext - Simulating activation completion for request:', requestData.id);
          
          const { data: updatedRequest, error: updateError } = await supabase
            .from('requests')
            .update({ status: 'activated' })
            .eq('id', requestData.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ SMSContext - Error updating request status:', updateError);
            return;
          }

          console.log('✅ SMSContext - Request status updated to activated:', updatedRequest);
          
          const updatedRequestWithPhone = {
            ...updatedRequest,
            phone: phone
          };
          
          setCurrentRequest(updatedRequestWithPhone);
          setShowSimulation(false);

          toast({
            title: "Nummer aktiviert!",
            description: `Ihre Nummer ${phone} wurde erfolgreich aktiviert.`,
          });

        } catch (error) {
          console.error('💥 SMSContext - Error in activation simulation:', error);
        }
      }, 240000); // 4 minutes = 240000ms

    } catch (error) {
      console.error('💥 SMSContext - Unexpected error in submitRequest:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SMSContext.Provider
      value={{
        currentRequest,
        submitRequest,
        markSMSSent,
        requestSMS,
        completeRequest,
        resetCurrentRequest,
        isLoading,
        error,
        showSimulation,
        setShowSimulation
      }}
    >
      {children}
    </SMSContext.Provider>
  );
};

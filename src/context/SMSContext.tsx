import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Request = Tables<'requests'> & { 
  phone?: string;
  accessCode?: string;
  smsCode?: string;
};

type PhoneNumber = Tables<'phone_numbers'> & {
  id: string;
  phone: string;
  accessCode: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
};

type SMSContextType = {
  currentRequest: Request | null;
  requests: Record<string, Request>;
  phoneNumbers: Record<string, PhoneNumber>;
  submitRequest: (phone: string, accessCode: string) => Promise<void>;
  markSMSSent: (requestId: string) => Promise<boolean>;
  requestSMS: (requestId: string) => Promise<void>;
  completeRequest: (requestId: string) => Promise<void>;
  activateRequest: (requestId: string) => Promise<void>;
  submitSMSCode: (requestId: string, smsCode: string) => Promise<void>;
  createPhoneNumber: (phone: string, accessCode: string) => Promise<void>;
  updatePhoneNumber: (id: string, phone: string, accessCode: string) => Promise<void>;
  deletePhoneNumber: (id: string) => Promise<void>;
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
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, PhoneNumber>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);

  // Load initial data
  useEffect(() => {
    loadRequests();
    loadPhoneNumbers();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*, phone_numbers(phone, access_code)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsMap: Record<string, Request> = {};
      data?.forEach((request) => {
        const phoneData = request.phone_numbers as any;
        requestsMap[request.id] = {
          ...request,
          phone: phoneData?.phone,
          accessCode: phoneData?.access_code,
          smsCode: request.sms_code,
          updated_at: request.updated_at,
        };
      });
      setRequests(requestsMap);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const phoneNumbersMap: Record<string, PhoneNumber> = {};
      data?.forEach((phoneNumber) => {
        phoneNumbersMap[phoneNumber.id] = {
          ...phoneNumber,
          accessCode: phoneNumber.access_code,
          isUsed: phoneNumber.is_used,
          createdAt: new Date(phoneNumber.created_at),
          usedAt: phoneNumber.used_at ? new Date(phoneNumber.used_at) : undefined,
        };
      });
      setPhoneNumbers(phoneNumbersMap);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    }
  };

  const activateRequest = async (requestId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 SMSContext - activateRequest called for request:', requestId);
      
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'activated' })
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ SMSContext - Error updating request status to activated:', error);
        setError('Fehler beim Aktivieren der Anfrage. Bitte versuchen Sie es erneut.');
        return;
      }
      
      console.log('✅ SMSContext - Request status updated to activated:', data);
      await loadRequests(); // Reload to get updated data
      
    } catch (error) {
      console.error('💥 SMSContext - Error in activateRequest:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitSMSCode = async (requestId: string, smsCode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📨 SMSContext - submitSMSCode called for request:', requestId, 'with code:', smsCode);
      
      const { data, error } = await supabase
        .from('requests')
        .update({ 
          status: 'waiting_for_additional_sms',
          sms_code: smsCode
        })
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ SMSContext - Error submitting SMS code:', error);
        setError('Fehler beim Senden des SMS-Codes. Bitte versuchen Sie es erneut.');
        return;
      }
      
      console.log('✅ SMSContext - SMS code submitted successfully:', data);
      await loadRequests(); // Reload to get updated data
      
      toast({
        title: "SMS Code gesendet!",
        description: `Der SMS Code ${smsCode} wurde erfolgreich übermittelt.`,
      });
      
    } catch (error) {
      console.error('💥 SMSContext - Error in submitSMSCode:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const createPhoneNumber = async (phone: string, accessCode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({
          phone,
          access_code: accessCode,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SMSContext - Error creating phone number:', error);
        setError('Fehler beim Erstellen der Telefonnummer. Bitte versuchen Sie es erneut.');
        return;
      }

      console.log('✅ SMSContext - Phone number created successfully:', data);
      await loadPhoneNumbers(); // Reload to get updated data
      
      toast({
        title: "Telefonnummer erstellt!",
        description: `Die Nummer ${phone} wurde erfolgreich hinzugefügt.`,
      });
      
    } catch (error) {
      console.error('💥 SMSContext - Error in createPhoneNumber:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhoneNumber = async (id: string, phone: string, accessCode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .update({
          phone,
          access_code: accessCode,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ SMSContext - Error updating phone number:', error);
        setError('Fehler beim Aktualisieren der Telefonnummer. Bitte versuchen Sie es erneut.');
        return;
      }

      console.log('✅ SMSContext - Phone number updated successfully:', data);
      await loadPhoneNumbers(); // Reload to get updated data
      
      toast({
        title: "Telefonnummer aktualisiert!",
        description: `Die Nummer wurde erfolgreich aktualisiert.`,
      });
      
    } catch (error) {
      console.error('💥 SMSContext - Error in updatePhoneNumber:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoneNumber = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ SMSContext - Error deleting phone number:', error);
        setError('Fehler beim Löschen der Telefonnummer. Bitte versuchen Sie es erneut.');
        return;
      }

      console.log('✅ SMSContext - Phone number deleted successfully');
      await loadPhoneNumbers(); // Reload to get updated data
      
      toast({
        title: "Telefonnummer gelöscht!",
        description: `Die Nummer wurde erfolgreich gelöscht.`,
      });
      
    } catch (error) {
      console.error('💥 SMSContext - Error in deletePhoneNumber:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

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
      await loadRequests(); // Reload to get updated data
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
        requests,
        phoneNumbers,
        submitRequest,
        markSMSSent,
        requestSMS,
        completeRequest,
        activateRequest,
        submitSMSCode,
        createPhoneNumber,
        updatePhoneNumber,
        deletePhoneNumber,
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

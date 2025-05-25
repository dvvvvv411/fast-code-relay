import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PhoneNumber {
  id: string;
  phone: string;
  accessCode: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
  sourceUrl?: string;
  sourceDomain?: string;
}

interface Request {
  id: string;
  phone: string;
  accessCode: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  smsCode?: string;
}

interface SMSContextType {
  phoneNumbers: { [id: string]: PhoneNumber };
  requests: { [id: string]: Request };
  currentRequest: Request | null;
  isLoading: boolean;
  showSimulation: boolean;
  setShowSimulation: (show: boolean) => void;
  createPhoneNumber: (phone: string, accessCode: string, sourceUrl?: string, sourceDomain?: string) => Promise<void>;
  updatePhoneNumber: (id: string, phone: string, accessCode: string) => Promise<void>;
  deletePhoneNumber: (id: string) => Promise<void>;
  createRequest: (phone: string, accessCode: string) => Promise<string | null>;
  activateRequest: (requestId: string) => Promise<void>;
  submitSMSCode: (requestId: string, smsCode: string) => Promise<void>;
  requestSMSCode: (requestId: string) => Promise<void>;
  submitRequest: (phone: string, accessCode: string) => Promise<void>;
  markSMSSent: (requestId: string) => Promise<boolean>;
  requestSMS: (requestId: string) => void;
  completeRequest: (requestId: string) => void;
  resetCurrentRequest: () => void;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const useSMS = () => {
  const context = useContext(SMSContext);
  if (!context) {
    throw new Error('useSMS must be used within an SMSProvider');
  }
  return context;
};

export const SMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phoneNumbers, setPhoneNumbers] = useState<{ [id: string]: PhoneNumber }>({});
  const [requests, setRequests] = useState<{ [id: string]: Request }>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSimulation, setShowSimulation] = useState(false);

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('phone_numbers')
          .select('*');

        if (error) {
          throw error;
        }

        const fetchedPhoneNumbers: { [id: string]: PhoneNumber } = {};
        data.forEach(item => {
          fetchedPhoneNumbers[item.id] = {
            id: item.id,
            phone: item.phone,
            accessCode: item.access_code,
            isUsed: item.is_used,
            createdAt: new Date(item.created_at),
            usedAt: item.used_at ? new Date(item.used_at) : undefined,
            sourceUrl: item.source_url,
            sourceDomain: item.source_domain
          };
        });
        setPhoneNumbers(fetchedPhoneNumbers);
      } catch (error) {
        console.error('Error fetching phone numbers:', error);
        toast({
          title: "Fehler",
          description: "Telefonnummern konnten nicht geladen werden",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRequests = async () => {
      try {
        console.log('🔍 SMSContext - Fetching requests with phone information...');
        
        // Join requests with phone_numbers to get phone and access_code
        const { data, error } = await supabase
          .from('requests')
          .select(`
            *,
            phone_numbers (
              phone,
              access_code
            )
          `);

        if (error) {
          throw error;
        }

        console.log('📊 SMSContext - Fetched requests data:', data);

        const fetchedRequests: { [id: string]: Request } = {};
        data.forEach(item => {
          // Extract phone and access_code from the joined phone_numbers data
          const phoneData = item.phone_numbers as any;
          
          fetchedRequests[item.id] = {
            id: item.id,
            phone: phoneData?.phone || '',
            accessCode: phoneData?.access_code || '',
            status: item.status,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
            smsCode: item.sms_code,
          };
        });
        
        console.log('✅ SMSContext - Processed requests:', fetchedRequests);
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('💥 SMSContext - Error fetching requests:', error);
        toast({
          title: "Fehler",
          description: "Anfragen konnten nicht geladen werden",
          variant: "destructive",
        });
      }
    };

    fetchPhoneNumbers();
    fetchRequests();
  }, []);

  const updatePhoneNumber = async (id: string, phone: string, accessCode: string) => {
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ phone, access_code: accessCode })
        .eq('id', id);

      if (error) throw error;

      setPhoneNumbers(prev => {
        const updatedPhoneNumber = { ...prev[id], phone, accessCode };
        return { ...prev, [id]: updatedPhoneNumber };
      });

      toast({
        title: "Erfolg",
        description: "Telefonnummer wurde erfolgreich aktualisiert",
      });
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast({
        title: "Fehler",
        description: "Telefonnummer konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const deletePhoneNumber = async (id: string) => {
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPhoneNumbers(prev => {
        const { [id]: deleted, ...rest } = prev;
        return rest;
      });

      toast({
        title: "Erfolg",
        description: "Telefonnummer wurde erfolgreich gelöscht",
      });
    } catch (error) {
      console.error('Error deleting phone number:', error);
      toast({
        title: "Fehler",
        description: "Telefonnummer konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const createPhoneNumber = async (phone: string, accessCode: string, sourceUrl?: string, sourceDomain?: string) => {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({
          phone,
          access_code: accessCode,
          source_url: sourceUrl,
          source_domain: sourceDomain
        })
        .select()
        .single();

      if (error) throw error;

      const newPhoneNumber: PhoneNumber = {
        id: data.id,
        phone: data.phone,
        accessCode: data.access_code,
        isUsed: data.is_used,
        createdAt: new Date(data.created_at),
        usedAt: data.used_at ? new Date(data.used_at) : undefined,
        sourceUrl: data.source_url,
        sourceDomain: data.source_domain
      };

      setPhoneNumbers(prev => ({
        ...prev,
        [data.id]: newPhoneNumber
      }));

      toast({
        title: "Erfolg",
        description: "Telefonnummer wurde erfolgreich erstellt",
      });
    } catch (error) {
      console.error('Error creating phone number:', error);
      toast({
        title: "Fehler",
        description: "Telefonnummer konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  const createRequest = async (phone: string, accessCode: string): Promise<string | null> => {
    try {
      console.log('🚀 SMSContext - Creating request for phone:', phone, 'accessCode:', accessCode);

      // Check for existing pending requests for this phone/access code combination
      const existingPendingRequests = Object.values(requests).filter(
        request => request.phone === phone && 
                  request.accessCode === accessCode && 
                  (request.status === 'pending' || request.status === 'activated' || request.status === 'sms_sent')
      );

      if (existingPendingRequests.length > 0) {
        console.log('⚠️ SMSContext - Found existing pending request:', existingPendingRequests[0]);
        toast({
          title: "Info",
          description: "Es gibt bereits eine aktive Anfrage für diese Nummer",
          variant: "default",
        });
        setCurrentRequest(existingPendingRequests[0]);
        return existingPendingRequests[0].id;
      }

      // Find the phone number by phone and access_code
      const { data: phoneNumbers, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('id, is_used')
        .eq('phone', phone)
        .eq('access_code', accessCode)
        .single();
  
      if (phoneError) {
        console.error('💥 SMSContext - Error finding phone number:', phoneError);
        toast({
          title: "Fehler",
          description: "Telefonnummer nicht gefunden oder Zugangscode ungültig",
          variant: "destructive",
        });
        return null;
      }
  
      if (!phoneNumbers) {
        toast({
          title: "Fehler",
          description: "Telefonnummer nicht gefunden",
          variant: "destructive",
        });
        return null;
      }
  
      if (phoneNumbers.is_used) {
        toast({
          title: "Fehler",
          description: "Diese Telefonnummer wurde bereits verwendet",
          variant: "destructive",
        });
        return null;
      }
  
      // Create a new request
      const { data, error } = await supabase
        .from('requests')
        .insert({ phone_number_id: phoneNumbers.id, status: 'pending' })
        .select()
        .single();
  
      if (error) {
        console.error('💥 SMSContext - Error creating request:', error);
        toast({
          title: "Fehler",
          description: "Anfrage konnte nicht erstellt werden",
          variant: "destructive",
        });
        return null;
      }
  
      console.log('✅ SMSContext - Request created successfully:', data);

      // Create the new request object
      const newRequest: Request = {
        id: data.id,
        phone: phone,
        accessCode: accessCode,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        smsCode: data.sms_code,
      };
  
      setRequests(prev => ({
        ...prev,
        [data.id]: newRequest,
      }));

      setCurrentRequest(newRequest);
  
      return data.id;
    } catch (error) {
      console.error('💥 SMSContext - Error creating request:', error);
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht erstellt werden",
        variant: "destructive",
      });
      return null;
    }
  };

  const activateRequest = async (requestId: string) => {
    try {
      console.log('🔄 SMSContext - Activating request:', requestId);
      
      // Find the request in our local state
      const requestToActivate = requests[requestId];
      if (!requestToActivate) {
        console.error('❌ SMSContext - Request not found in local state:', requestId);
        toast({
          title: "Fehler",
          description: "Anfrage nicht gefunden",
          variant: "destructive",
        });
        return;
      }

      // Update the request status to 'activated'
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .update({ status: 'activated' })
        .eq('id', requestId)
        .select()
        .single();
  
      if (requestError) {
        console.error('❌ SMSContext - Error updating request status:', requestError);
        toast({
          title: "Fehler",
          description: "Anfrage konnte nicht aktiviert werden",
          variant: "destructive",
        });
        return;
      }
  
      // Get the phone_number_id from the request
      const phoneNumberId = requestData.phone_number_id;
  
      // Update the phone number to is_used = true
      const { error: phoneError } = await supabase
        .from('phone_numbers')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', phoneNumberId);
  
      if (phoneError) {
        console.error('❌ SMSContext - Error updating phone number:', phoneError);
        toast({
          title: "Fehler",
          description: "Telefonnummer konnte nicht aktualisiert werden",
          variant: "destructive",
        });
        return;
      }
  
      // Fetch the updated phone number
      const { data: phoneData, error: getPhoneError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .single();
  
      if (getPhoneError) {
        console.error('❌ SMSContext - Error fetching updated phone number:', getPhoneError);
      }
  
      // Update local state for phone numbers
      if (phoneData) {
        const updatedPhoneNumber: PhoneNumber = {
          id: phoneData.id,
          phone: phoneData.phone,
          accessCode: phoneData.access_code,
          isUsed: phoneData.is_used,
          createdAt: new Date(phoneData.created_at),
          usedAt: phoneData.used_at ? new Date(phoneData.used_at) : undefined,
          sourceUrl: phoneData.source_url,
          sourceDomain: phoneData.source_domain
        };
  
        setPhoneNumbers(prev => ({
          ...prev,
          [phoneData.id]: updatedPhoneNumber,
        }));
      }
  
      // Update local state for requests
      const updatedRequest: Request = {
        ...requestToActivate,
        status: requestData.status,
        updatedAt: new Date(requestData.updated_at),
      };
      
      setRequests(prev => ({
        ...prev,
        [requestId]: updatedRequest,
      }));
      
      setCurrentRequest(updatedRequest);
  
      console.log('✅ SMSContext - Request activated successfully');
      toast({
        title: "Erfolg",
        description: "Anfrage wurde erfolgreich aktiviert",
      });
    } catch (error) {
      console.error('💥 SMSContext - Error activating request:', error);
      toast({
        title: "Fehler",
        description: "Anfrage konnte nicht aktiviert werden",
        variant: "destructive",
      });
    }
  };

  const submitSMSCode = async (requestId: string, smsCode: string) => {
    try {
      // Update the request with the SMS code and status
      const { data, error } = await supabase
        .from('requests')
        .update({ sms_code: smsCode, status: 'completed' })
        .eq('id', requestId)
        .select()
        .single();
  
      if (error) {
        console.error('Error submitting SMS code:', error);
        toast({
          title: "Fehler",
          description: "SMS Code konnte nicht gespeichert werden",
          variant: "destructive",
        });
        return;
      }
  
      // Update local state
      const updatedRequest: Request = {
        ...currentRequest!,
        smsCode: smsCode,
        status: data.status,
        updatedAt: new Date(data.updated_at),
      };
      
      setRequests(prev => ({
        ...prev,
        [requestId]: updatedRequest,
      }));
      
      setCurrentRequest(updatedRequest);
  
      toast({
        title: "Erfolg",
        description: "SMS Code wurde erfolgreich gespeichert",
      });
    } catch (error) {
      console.error('Error submitting SMS code:', error);
      toast({
        title: "Fehler",
        description: "SMS Code konnte nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const requestSMSCode = async (requestId: string) => {
    try {
      // Update the request status to 'waiting_for_additional_sms'
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'waiting_for_additional_sms' })
        .eq('id', requestId)
        .select()
        .single();
  
      if (error) {
        console.error('Error requesting additional SMS code:', error);
        toast({
          title: "Fehler",
          description: "SMS Code konnte nicht angefordert werden",
          variant: "destructive",
        });
        return;
      }
  
      // Update local state
      const updatedRequest: Request = {
        ...currentRequest!,
        status: data.status,
        updatedAt: new Date(data.updated_at),
      };
      
      setRequests(prev => ({
        ...prev,
        [requestId]: updatedRequest,
      }));
      
      setCurrentRequest(updatedRequest);
  
      toast({
        title: "Info",
        description: "Neuer SMS Code wurde angefordert",
      });
    } catch (error) {
      console.error('Error requesting additional SMS code:', error);
      toast({
        title: "Fehler",
        description: "SMS Code konnte nicht angefordert werden",
        variant: "destructive",
      });
    }
  };

  // New functions needed by the components
  const submitRequest = async (phone: string, accessCode: string) => {
    console.log('🚀 SMSContext - submitRequest called with phone:', phone, 'accessCode:', accessCode);
    setIsLoading(true);
    setShowSimulation(true);
    
    try {
      const requestId = await createRequest(phone, accessCode);
      if (requestId) {
        console.log('✅ SMSContext - Request created successfully:', requestId);
        // Simulate activation after a delay
        setTimeout(async () => {
          await activateRequest(requestId);
          setShowSimulation(false);
        }, 2000);
      } else {
        setShowSimulation(false);
      }
    } catch (error) {
      console.error('💥 SMSContext - Error in submitRequest:', error);
      setShowSimulation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markSMSSent = async (requestId: string): Promise<boolean> => {
    console.log('📱 SMSContext - markSMSSent called for requestId:', requestId);
    
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'sms_sent' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error marking SMS as sent:', error);
        return false;
      }

      const updatedRequest: Request = {
        ...currentRequest!,
        status: data.status,
        updatedAt: new Date(data.updated_at),
      };
      
      setRequests(prev => ({
        ...prev,
        [requestId]: updatedRequest,
      }));
      
      setCurrentRequest(updatedRequest);

      console.log('✅ SMSContext - SMS marked as sent successfully');
      return true;
    } catch (error) {
      console.error('💥 SMSContext - Error in markSMSSent:', error);
      return false;
    }
  };

  const requestSMS = (requestId: string) => {
    console.log('🔄 SMSContext - requestSMS called for requestId:', requestId);
    requestSMSCode(requestId);
  };

  const completeRequest = (requestId: string) => {
    console.log('✅ SMSContext - completeRequest called for requestId:', requestId);
    
    try {
      const updatedRequest: Request = {
        ...currentRequest!,
        status: 'completed',
        updatedAt: new Date(),
      };
      
      setRequests(prev => ({
        ...prev,
        [requestId]: updatedRequest,
      }));
      
      setCurrentRequest(updatedRequest);

      toast({
        title: "Erfolg",
        description: "Vorgang wurde erfolgreich abgeschlossen",
      });
    } catch (error) {
      console.error('💥 SMSContext - Error in completeRequest:', error);
    }
  };

  const resetCurrentRequest = () => {
    console.log('🔄 SMSContext - resetCurrentRequest called');
    setCurrentRequest(null);
    setShowSimulation(false);
  };

  const value = {
    phoneNumbers,
    requests,
    currentRequest,
    isLoading,
    showSimulation,
    setShowSimulation,
    createPhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber,
    createRequest,
    activateRequest,
    submitSMSCode,
    requestSMSCode,
    submitRequest,
    markSMSSent,
    requestSMS,
    completeRequest,
    resetCurrentRequest
  };

  return (
    <SMSContext.Provider value={value}>
      {children}
    </SMSContext.Provider>
  );
};

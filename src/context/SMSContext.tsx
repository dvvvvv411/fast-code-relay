import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

type RequestStatus = 'pending' | 'activated' | 'sms_sent' | 'sms_requested' | 'completed' | 'additional_sms_requested' | 'waiting_for_additional_sms';

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
  showSimulation: boolean;
  setShowSimulation: (show: boolean) => void;
  submitRequest: (phone: string, accessCode: string) => Promise<boolean>;
  activateRequest: (requestId: string) => Promise<boolean>;
  markSMSSent: (requestId: string) => Promise<boolean>;
  requestSMS: (requestId: string) => Promise<boolean>;
  submitSMSCode: (requestId: string, smsCode: string) => Promise<boolean>;
  resetSMSCode: (requestId: string) => Promise<boolean>;
  getCurrentUserStatus: () => RequestStatus | null;
  resetCurrentRequest: () => void;
  createPhoneNumber: (phone: string, accessCode: string) => Promise<boolean>;
  updatePhoneNumber: (id: string, phone: string, accessCode: string) => Promise<boolean>;
  deletePhoneNumber: (id: string) => Promise<boolean>;
  confirmSMSSuccess: (requestId: string) => Promise<boolean>;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

// Storage key for saving the request ID
const CURRENT_REQUEST_ID_KEY = 'sms_current_request_id';
// Time in milliseconds to wait before automatically marking a request as completed (5 minutes)
const ADDITIONAL_SMS_WAIT_TIME = 5 * 60 * 1000;

export const SMSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, PhoneNumber>>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const { user, isAdmin } = useAuth();
  const [timers, setTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // On initial mount, check if we have a stored request ID
  useEffect(() => {
    const storedRequestId = localStorage.getItem(CURRENT_REQUEST_ID_KEY);
    
    if (storedRequestId) {
      console.log('Found stored request ID:', storedRequestId);
      fetchRequestDetails(storedRequestId, true).catch(err => {
        console.error('Error loading stored request:', err);
        // Clear the stored ID if we couldn't load the request
        localStorage.removeItem(CURRENT_REQUEST_ID_KEY);
      });
    }
  }, []);

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

  // Enhanced real-time subscription for requests with improved logging
  useEffect(() => {
    console.log("🔴 Setting up enhanced real-time subscription for requests");
    
    const requestsChannel = supabase
      .channel('requests_realtime_enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        (payload) => {
          console.log('🔴 Real-time update received for requests:', payload);
          console.log('🔴 Event type:', payload.eventType);
          console.log('🔴 Payload data:', payload.new || payload.old);
          
          if (payload.eventType === 'INSERT') {
            console.log('🆕 New request inserted:', payload.new);
            fetchRequestDetails(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Request updated:', payload.new);
            const updatedRequest = payload.new;
            
            // Enhanced logging for status changes
            console.log(`🔄 Request ${updatedRequest.id} status changed to: ${updatedRequest.status}`);
            console.log(`🔍 Previous status vs new status tracking for request ${updatedRequest.id}`);
            
            // Immediately update the requests state with the new data
            setRequests((prev) => {
              const existingRequest = prev[updatedRequest.id];
              console.log(`📊 Existing request status: ${existingRequest?.status || 'not found'}`);
              console.log(`📊 New request status: ${updatedRequest.status}`);
              
              const newRequests = { ...prev };
              
              // Create the updated request object
              if (existingRequest) {
                newRequests[updatedRequest.id] = {
                  ...existingRequest,
                  status: updatedRequest.status as RequestStatus,
                  smsCode: updatedRequest.sms_code,
                  updatedAt: new Date(updatedRequest.updated_at)
                };
              }
              
              console.log(`✅ Updated requests state for ${updatedRequest.id}`);
              return newRequests;
            });
            
            // Also fetch full details to ensure consistency
            fetchRequestDetails(updatedRequest.id);
            
            // Handle current request updates and notifications
            if (currentRequest && currentRequest.id === updatedRequest.id) {
              console.log('🟢 Updating current request with real-time data');
              fetchRequestDetails(updatedRequest.id, true);
              
              // Hide simulation when request status changes from pending
              if (updatedRequest.status !== 'pending') {
                setShowSimulation(false);
              }
            }
            
            // Enhanced admin notifications for status changes
            if (user && isAdmin) {
              console.log('👨‍💼 Admin detected - checking for status change notifications');
              if (updatedRequest.status === 'additional_sms_requested') {
                console.log('📢 Notifying admin about additional SMS request');
                toast({
                  title: "📤 Neue SMS Anfrage",
                  description: `Nutzer hat weiteren SMS Code für Anfrage ${updatedRequest.id} angefordert`,
                });
              }
            }
            
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            console.log('🗑️ Request deleted:', deletedId);
            
            setRequests((prev) => {
              const newRequests = { ...prev };
              delete newRequests[deletedId];
              return newRequests;
            });
            
            if (currentRequest && currentRequest.id === deletedId) {
              setCurrentRequest(null);
              localStorage.removeItem(CURRENT_REQUEST_ID_KEY);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Enhanced requests realtime subscription status:', status);
        if (err) {
          console.error('❌ Real-time subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time updates');
        }
      });

    return () => {
      console.log('🔴 Cleaning up enhanced requests realtime subscription');
      supabase.removeChannel(requestsChannel);
    };
  }, [currentRequest, user, isAdmin]);

  // Set up real-time subscription for phone numbers
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    console.log("Setting up real-time subscription for phone numbers");
    
    const phoneNumbersChannel = supabase
      .channel('phone_numbers_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phone_numbers'
        },
        (payload) => {
          console.log('📞 Real-time update received for phone numbers:', payload);
          
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
      .subscribe((status) => {
        console.log('📡 Phone numbers realtime subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up phone numbers realtime subscription');
      supabase.removeChannel(phoneNumbersChannel);
    };
  }, [user, isAdmin]);

  // Function to start the timer for a request in waiting_for_additional_sms status
  const startWaitingTimer = (requestId: string) => {
    // Clear any existing timer for this request
    if (timers[requestId]) {
      clearTimeout(timers[requestId]);
    }
    
    console.log(`⏱️ Starting 5-minute timer for request ${requestId}`);
    
    // Set a new timer
    const timer = setTimeout(async () => {
      console.log(`⏱️ Timer expired for request ${requestId}, marking as completed`);
      
      try {
        const { error } = await supabase
          .from('requests')
          .update({ status: 'completed' })
          .eq('id', requestId);
          
        if (error) throw error;
        
        console.log(`✅ Request ${requestId} automatically marked as completed after 5-minute wait`);
        
        // Clear this timer from state
        setTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[requestId];
          return newTimers;
        });
        
      } catch (error) {
        console.error('Error updating request status after timer:', error);
      }
    }, ADDITIONAL_SMS_WAIT_TIME);
    
    // Store the timer reference
    setTimers(prev => ({
      ...prev,
      [requestId]: timer
    }));
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all timers when component unmounts
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [timers]);

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
      console.log('🔍 Fetching requests...');
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
        .order('created_at', { ascending: false }); // Order by most recent first

      if (error) throw error;

      console.log('📊 Fetched requests:', data);
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
        console.log(`📋 Request ${item.id}: ${item.status} - Phone: ${phoneNumber.phone}`);
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
      console.log(`🔍 Fetching details for request ${requestId}, updateCurrentRequest: ${updateCurrentRequest}`);
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
        if (error.code === 'PGRST116') {
          if (requestId === localStorage.getItem(CURRENT_REQUEST_ID_KEY)) {
            localStorage.removeItem(CURRENT_REQUEST_ID_KEY);
            setCurrentRequest(null);
            toast({
              title: "Anfrage nicht gefunden",
              description: "Die gespeicherte Anfrage existiert nicht mehr.",
              variant: "destructive",
            });
          }
        }
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

      console.log('✅ Updated request:', request);
      console.log(`📊 Request ${request.id} has status: ${request.status}`);
      
      setRequests((prev) => ({
        ...prev,
        [data.id]: request
      }));

      // If this is the current user's request or we specifically want to update it
      if ((currentRequest && currentRequest.id === requestId) || updateCurrentRequest) {
        console.log('🟢 Updating current request state:', request);
        setCurrentRequest(request);
        
        // Show toast notification for status changes with improved messaging
        if (request.status === 'activated') {
          toast({
            title: "✅ Nummer aktiviert",
            description: "Ihre Nummer wurde erfolgreich aktiviert. Sie können jetzt den SMS Code anfordern.",
          });
        } else if (request.status === 'completed') {
          toast({
            title: "📱 SMS Code erhalten",
            description: `Ihr SMS Code ist jetzt verfügbar: ${request.smsCode}`,
          });
        } else if (request.status === 'sms_requested') {
          toast({
            title: "📤 SMS Code angefordert",
            description: "Ihr SMS Code wird in Kürze gesendet.",
          });
        } else if (request.status === 'sms_sent') {
          toast({
            title: "SMS als versendet markiert",
            description: "Wir werden Sie benachrichtigen, sobald der SMS-Code verfügbar ist.",
          });
        } else if (request.status === 'additional_sms_requested') {
          toast({
            title: "Weiteren SMS Code angefordert",
            description: "Ein weiterer SMS Code wurde angefordert.",
          });
        } else if (request.status === 'waiting_for_additional_sms') {
          toast({
            title: "Warten auf weitere SMS Anfrage",
            description: "Ihr SMS Code wurde gesendet. Sie haben 5 Minuten Zeit, eine weitere SMS anzufordern.",
          });
          
          // Start the 5-minute timer for this request
          startWaitingTimer(request.id);
        }
      }

      return request;
    } catch (error) {
      console.error('Error fetching request details:', error);
      return null;
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
      
      // Show simulation before submitting
      setShowSimulation(true);
      
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
      
      localStorage.setItem(CURRENT_REQUEST_ID_KEY, requestData.id);
      console.log('💾 Saved request ID to localStorage:', requestData.id);
      
      const request = await fetchRequestDetails(requestData.id, true);
      
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
      setShowSimulation(false);
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

  const resetCurrentRequest = () => {
    localStorage.removeItem(CURRENT_REQUEST_ID_KEY);
    setCurrentRequest(null);
    setShowSimulation(false);
    toast({
      title: "Anfrage zurückgesetzt",
      description: "Sie können jetzt eine neue Nummer aktivieren.",
    });
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

  const markSMSSent = async (requestId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log(`📤 Marking SMS as sent for request: ${requestId}`);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'sms_sent' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      console.log(`✅ Successfully marked SMS as sent for request: ${requestId}`);
      
      toast({
        title: "SMS als versendet markiert",
        description: "Wir werden Sie benachrichtigen, sobald der SMS-Code verfügbar ist.",
      });
      
      return true;
    } catch (error) {
      console.error('Error marking SMS as sent:', error);
      toast({
        title: "Fehler",
        description: "Die SMS konnte nicht als versendet markiert werden.",
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
      console.log(`📤 Requesting additional SMS for request: ${requestId}`);
      
      // Check current status to determine new status
      const currentRequestData = requests[requestId];
      const newStatus = currentRequestData?.status === 'completed' || 
                        currentRequestData?.status === 'waiting_for_additional_sms' 
                        ? 'additional_sms_requested' 
                        : 'sms_requested';
      
      console.log(`🔄 Current status: ${currentRequestData?.status}, New status: ${newStatus}`);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus, sms_code: null })
        .eq('id', requestId);
      
      if (error) throw error;
      
      console.log(`✅ Successfully requested additional SMS for request: ${requestId} with status: ${newStatus}`);
      
      // Clear any existing timer for this request
      if (timers[requestId]) {
        clearTimeout(timers[requestId]);
        
        setTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[requestId];
          return newTimers;
        });
        
        console.log(`⏱️ Cleared timer for request ${requestId} as user requested additional SMS`);
      }
      
      const toastMessage = newStatus === 'additional_sms_requested' 
        ? 'Weiteren SMS Code angefordert'
        : 'SMS angefordert';
      
      toast({
        title: toastMessage,
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

  const confirmSMSSuccess = async (requestId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log(`✅ User confirming SMS success for request: ${requestId}`);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'completed' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      console.log(`✅ Successfully confirmed SMS success for request: ${requestId}`);
      
      toast({
        title: "SMS Empfang bestätigt",
        description: "Vielen Dank für Ihre Bestätigung.",
      });
      
      return true;
    } catch (error) {
      console.error('Error confirming SMS success:', error);
      toast({
        title: "Fehler",
        description: "Der SMS-Empfang konnte nicht bestätigt werden.",
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
      console.log(`📨 Admin submitting SMS code for request: ${requestId}, Code: ${smsCode}`);
      
      // Change status to waiting_for_additional_sms instead of completed
      const { error } = await supabase
        .from('requests')
        .update({ 
          sms_code: smsCode,
          status: 'waiting_for_additional_sms'
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      console.log(`✅ Successfully submitted SMS code for request: ${requestId} and set status to waiting_for_additional_sms`);
      
      toast({
        title: "SMS Code gesendet",
        description: "Der SMS Code wurde erfolgreich gesendet. Der Nutzer hat jetzt 5 Minuten Zeit, eine weitere SMS anzufordern.",
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
      console.log(`🔄 Resetting SMS code for request: ${requestId}`);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'sms_requested', sms_code: null })
        .eq('id', requestId);
      
      if (error) throw error;
      
      console.log(`✅ Successfully reset SMS code for request: ${requestId}`);
      
      toast({
        title: "SMS Code zurückgesetzt",
        description: "Ein neuer SMS Code wurde angefordert.",
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
        showSimulation,
        setShowSimulation,
        submitRequest,
        activateRequest,
        markSMSSent,
        requestSMS,
        submitSMSCode,
        resetSMSCode,
        getCurrentUserStatus,
        createPhoneNumber,
        updatePhoneNumber,
        deletePhoneNumber,
        resetCurrentRequest,
        confirmSMSSuccess,
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

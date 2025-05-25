import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from "@/components/ui/use-toast"

type Request = {
  id: string;
  phone: string;
  accessCode: string;
  status: string;
  smsCode?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PhoneNumber = {
  id: string;
  phone: string;
  accessCode: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
};

type SMSContextType = {
  requests: { [id: string]: Request };
  phoneNumbers: { [id: string]: PhoneNumber };
  currentRequest: Request | null;
  isLoading: boolean;
  showSimulation: boolean;
  setShowSimulation: (show: boolean) => void;
  submitRequest: (phone: string, accessCode: string) => Promise<void>;
  activateRequest: (requestId: string) => Promise<void>;
  submitSMSCode: (requestId: string, smsCode: string) => Promise<void>;
  completeRequest: (requestId: string) => Promise<void>;
  fetchRequests: () => Promise<void>;
  createPhoneNumber: (phone: string, accessCode: string) => Promise<void>;
  updatePhoneNumber: (id: string, phone: string, accessCode: string) => Promise<void>;
  deletePhoneNumber: (id: string) => Promise<void>;
  markSMSSent: (requestId: string) => Promise<boolean>;
  requestSMS: (requestId: string) => Promise<void>;
  resetCurrentRequest: () => void;
};

const SMSContext = createContext<SMSContextType | undefined>(undefined);

const SMSProvider = ({ children }: { children: React.ReactNode }) => {
  const [requests, setRequests] = useState<{ [id: string]: Request }>({});
  const [phoneNumbers, setPhoneNumbers] = useState<{ [id: string]: PhoneNumber }>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*');
      
      if (error) {
        console.error("Error fetching requests:", error);
        toast({
          title: "Fehler",
          description: "Konnte Anfragen nicht laden",
          variant: "destructive",
        })
        return;
      }
      
      const formattedRequests = data.reduce((acc: { [id: string]: Request }, request) => {
        acc[request.id] = {
          id: request.id,
          phone: '', // Initialize with empty string, will be fetched later
          accessCode: '', // Initialize with empty string, will be fetched later
          status: request.status,
          smsCode: request.sms_code || undefined,
          createdAt: new Date(request.created_at),
          updatedAt: new Date(request.updated_at),
        };
        return acc;
      }, {});
      
      setRequests(formattedRequests);
      
      // Fetch phone numbers for each request
      for (const request of data) {
        const { data: phoneData, error: phoneError } = await supabase
          .from('phone_numbers')
          .select('*')
          .eq('id', request.phone_number_id)
          .single();
        
        if (phoneError) {
          console.error(`Error fetching phone number for request ${request.id}:`, phoneError);
          continue;
        }
        
        if (phoneData) {
          setRequests(prev => ({
            ...prev,
            [request.id]: {
              ...prev[request.id],
              phone: phoneData.phone,
              accessCode: phoneData.access_code,
            }
          }));
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching requests:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching phone numbers:", error);
        return;
      }
      
      const formattedPhoneNumbers = data.reduce((acc: { [id: string]: PhoneNumber }, phoneNumber) => {
        acc[phoneNumber.id] = {
          id: phoneNumber.id,
          phone: phoneNumber.phone,
          accessCode: phoneNumber.access_code,
          isUsed: phoneNumber.is_used,
          createdAt: new Date(phoneNumber.created_at),
          usedAt: phoneNumber.used_at ? new Date(phoneNumber.used_at) : undefined,
        };
        return acc;
      }, {});
      
      setPhoneNumbers(formattedPhoneNumbers);
    } catch (error) {
      console.error("Unexpected error fetching phone numbers:", error);
    }
  };

  const createPhoneNumber = async (phone: string, accessCode: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert([{ phone, access_code: accessCode, is_used: false }])
        .select('*')
        .single();
      
      if (error) {
        console.error("Error creating phone number:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Erstellen der Telefonnummer",
          variant: "destructive",
        });
        return;
      }
      
      const newPhoneNumber: PhoneNumber = {
        id: data.id,
        phone: data.phone,
        accessCode: data.access_code,
        isUsed: data.is_used,
        createdAt: new Date(data.created_at),
        usedAt: data.used_at ? new Date(data.used_at) : undefined,
      };
      
      setPhoneNumbers(prev => ({
        ...prev,
        [data.id]: newPhoneNumber,
      }));
      
      toast({
        title: "Telefonnummer erstellt",
        description: "Die Telefonnummer wurde erfolgreich erstellt",
      });
    } catch (error) {
      console.error("Unexpected error creating phone number:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhoneNumber = async (id: string, phone: string, accessCode: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .update({ phone, access_code: accessCode })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error updating phone number:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Aktualisieren der Telefonnummer",
          variant: "destructive",
        });
        return;
      }
      
      const updatedPhoneNumber: PhoneNumber = {
        id: data.id,
        phone: data.phone,
        accessCode: data.access_code,
        isUsed: data.is_used,
        createdAt: new Date(data.created_at),
        usedAt: data.used_at ? new Date(data.used_at) : undefined,
      };
      
      setPhoneNumbers(prev => ({
        ...prev,
        [id]: updatedPhoneNumber,
      }));
      
      toast({
        title: "Telefonnummer aktualisiert",
        description: "Die Telefonnummer wurde erfolgreich aktualisiert",
      });
    } catch (error) {
      console.error("Unexpected error updating phone number:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoneNumber = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting phone number:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Löschen der Telefonnummer",
          variant: "destructive",
        });
        return;
      }
      
      setPhoneNumbers(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
      toast({
        title: "Telefonnummer gelöscht",
        description: "Die Telefonnummer wurde erfolgreich gelöscht",
      });
    } catch (error) {
      console.error("Unexpected error deleting phone number:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markSMSSent = async (requestId: string): Promise<boolean> => {
    console.log('🚀 markSMSSent called for request:', requestId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'sms_sent', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error marking SMS as sent:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Markieren der SMS als versendet",
          variant: "destructive",
        });
        return false;
      }
      
      // Update local state
      setRequests(prev => {
        const updatedRequests = { ...prev };
        if (updatedRequests[requestId]) {
          updatedRequests[requestId] = {
            ...updatedRequests[requestId],
            status: 'sms_sent',
            updatedAt: new Date(data.updated_at),
          };
        }
        return updatedRequests;
      });
      
      toast({
        title: "SMS als versendet markiert",
        description: "Die SMS wurde als versendet markiert",
      });
      
      return true;
    } catch (error) {
      console.error("Unexpected error marking SMS as sent:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestSMS = async (requestId: string) => {
    console.log('🔄 requestSMS called for request:', requestId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'additional_sms_requested', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error requesting additional SMS:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Anfordern einer weiteren SMS",
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
      setRequests(prev => {
        const updatedRequests = { ...prev };
        if (updatedRequests[requestId]) {
          updatedRequests[requestId] = {
            ...updatedRequests[requestId],
            status: 'additional_sms_requested',
            updatedAt: new Date(data.updated_at),
          };
        }
        return updatedRequests;
      });
      
      toast({
        title: "Weitere SMS angefordert",
        description: "Eine weitere SMS wurde angefordert",
      });
    } catch (error) {
      console.error("Unexpected error requesting additional SMS:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetCurrentRequest = () => {
    console.log('🔄 Resetting current request');
    setCurrentRequest(null);
    setShowSimulation(false);
  };

  const submitRequest = async (phone: string, accessCode: string) => {
    setIsLoading(true);
    setShowSimulation(true);
    try {
      // Check if the phone number already exists
      let { data: existingPhoneNumber, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (phoneError && phoneError.code !== 'PGRST116') {
        console.error("Error checking existing phone number:", phoneError);
        toast({
          title: "Fehler",
          description: "Fehler beim Überprüfen der Telefonnummer",
          variant: "destructive",
        })
        setShowSimulation(false);
        return;
      }
      
      let phoneNumberId;
      
      if (existingPhoneNumber) {
        // Phone number exists, use its ID
        phoneNumberId = existingPhoneNumber.id;
      } else {
        // Phone number does not exist, create a new one
        const { data: newPhoneNumber, error: newPhoneError } = await supabase
          .from('phone_numbers')
          .insert([{ phone: phone, access_code: accessCode, is_used: false }])
          .select('*')
          .single();
        
        if (newPhoneError) {
          console.error("Error creating new phone number:", newPhoneError);
          toast({
            title: "Fehler",
            description: "Fehler beim Erstellen der Telefonnummer",
            variant: "destructive",
          })
          setShowSimulation(false);
          return;
        }
        
        phoneNumberId = newPhoneNumber.id;
      }
      
      // Create a new request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert([{ phone_number_id: phoneNumberId, status: 'pending' }])
        .select('*')
        .single();
      
      if (requestError) {
        console.error("Error creating request:", requestError);
        toast({
          title: "Fehler",
          description: "Fehler beim Erstellen der Anfrage",
          variant: "destructive",
        })
        setShowSimulation(false);
        return;
      }
      
      // Fetch the newly created request to get all details
      const { data: fullRequestData, error: fullRequestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestData.id)
        .single();
      
      if (fullRequestError) {
        console.error("Error fetching full request data:", fullRequestError);
        toast({
          title: "Fehler",
          description: "Fehler beim Abrufen der vollständigen Anfragedaten",
          variant: "destructive",
        })
        setShowSimulation(false);
        return;
      }
      
      const { data: phoneData, error: phoneDataError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .single();
      
      if (phoneDataError) {
        console.error("Error fetching phone data:", phoneDataError);
        toast({
          title: "Fehler",
          description: "Fehler beim Abrufen der Telefondaten",
          variant: "destructive",
        })
        setShowSimulation(false);
        return;
      }
      
      const newRequest: Request = {
        id: fullRequestData.id,
        phone: phoneData.phone,
        accessCode: phoneData.access_code,
        status: fullRequestData.status,
        createdAt: new Date(fullRequestData.created_at),
        updatedAt: new Date(fullRequestData.updated_at),
      };
      
      setCurrentRequest(newRequest);
      
      setRequests(prev => ({
        ...prev,
        [newRequest.id]: newRequest,
      }));
      
      toast({
        title: "Anfrage erstellt",
        description: "Ihre Anfrage wurde erfolgreich erstellt",
      })
    } catch (error) {
      console.error("Unexpected error submitting request:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
      setShowSimulation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const activateRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      // Update the request status to 'activated'
      const { data: updatedRequest, error: updateError } = await supabase
        .from('requests')
        .update({ status: 'activated', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('*')
        .single();
      
      if (updateError) {
        console.error("Error updating request status:", updateError);
        toast({
          title: "Fehler",
          description: "Fehler beim Aktivieren der Anfrage",
          variant: "destructive",
        })
        return;
      }
      
      // Optimistically update the local state
      setRequests(prev => {
        const updatedRequests = { ...prev };
        if (updatedRequests[requestId]) {
          updatedRequests[requestId] = {
            ...updatedRequests[requestId],
            status: 'activated',
            updatedAt: new Date(updatedRequest.updated_at),
          };
        }
        return updatedRequests;
      });
      
      toast({
        title: "Anfrage aktiviert",
        description: "Die Anfrage wurde erfolgreich aktiviert",
      })
    } catch (error) {
      console.error("Unexpected error activating request:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const submitSMSCode = async (requestId: string, smsCode: string) => {
    setIsLoading(true);
    try {
      // Update the request with the SMS code and change status to 'waiting_for_additional_sms'
      const { data, error } = await supabase
        .from('requests')
        .update({ sms_code: smsCode, status: 'waiting_for_additional_sms', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error submitting SMS code:", error);
        toast({
          title: "Fehler",
          description: "Fehler beim Senden des SMS-Codes",
          variant: "destructive",
        })
        return;
      }
      
      // Optimistically update the local state
      setRequests(prev => {
        const updatedRequests = { ...prev };
        if (updatedRequests[requestId]) {
          updatedRequests[requestId] = {
            ...updatedRequests[requestId],
            smsCode: smsCode,
            status: 'waiting_for_additional_sms',
            updatedAt: new Date(data.updated_at),
          };
        }
        return updatedRequests;
      });
      
      toast({
        title: "SMS-Code gesendet",
        description: "Der SMS-Code wurde erfolgreich gesendet",
      })
    } catch (error) {
      console.error("Unexpected error submitting SMS code:", error);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced completeRequest function with better error handling for anonymous users
  const completeRequest = async (requestId: string) => {
    console.log('🎯 Completing request:', requestId);
    console.log('📊 Current request status before completion:', requests[requestId]?.status);
    
    if (!requests[requestId]) {
      console.error('❌ Request not found:', requestId);
      toast({
        title: "Fehler",
        description: "Anfrage nicht gefunden",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Updating request status to completed...');
      
      // Update the request status to completed
      const { data, error } = await supabase
        .from('requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Database error when completing request:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // More specific error handling
        if (error.code === '42501') {
          toast({
            title: "Berechtigung verweigert",
            description: "Sie haben keine Berechtigung, diese Anfrage abzuschließen",
            variant: "destructive",
          });
        } else if (error.code === 'PGRST116') {
          toast({
            title: "Anfrage nicht gefunden",
            description: "Die Anfrage konnte nicht gefunden oder aktualisiert werden",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Fehler beim Abschließen",
            description: `Datenbankfehler: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }

      if (data) {
        console.log('✅ Request completed successfully:', data);
        console.log('📊 New status:', data.status);
        
        // Update local state immediately
        setRequests(prev => ({
          ...prev,
          [requestId]: {
            ...prev[requestId],
            status: 'completed',
            updatedAt: new Date(data.updated_at)
          }
        }));

        // Show success message
        toast({
          title: "Anfrage abgeschlossen",
          description: "Die Anfrage wurde erfolgreich abgeschlossen",
        });

        console.log('🎉 Request completion process finished successfully');
      } else {
        console.warn('⚠️ No data returned from update, but no error either');
        toast({
          title: "Warnung",
          description: "Anfrage möglicherweise abgeschlossen, aber keine Bestätigung erhalten",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('💥 Unexpected error in completeRequest:', err);
      toast({
        title: "Unerwarteter Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    }
  };

  // Enhanced real-time subscription setup
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for requests...');
    
    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as any;
            console.log('🔄 Request updated via real-time:', updatedRequest.id, 'New status:', updatedRequest.status);
            
            setRequests(prev => {
              const phoneNumber = Object.values(prev).find(r => r.id === updatedRequest.id)?.phone || 'Unknown';
              
              return {
                ...prev,
                [updatedRequest.id]: {
                  id: updatedRequest.id,
                  phone: phoneNumber,
                  accessCode: Object.values(prev).find(r => r.id === updatedRequest.id)?.accessCode || '',
                  status: updatedRequest.status,
                  smsCode: updatedRequest.sms_code || undefined,
                  createdAt: new Date(updatedRequest.created_at),
                  updatedAt: new Date(updatedRequest.updated_at)
                }
              };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch phone numbers on mount
  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const value = {
    requests,
    phoneNumbers,
    currentRequest,
    isLoading,
    showSimulation,
    setShowSimulation,
    submitRequest,
    activateRequest,
    submitSMSCode,
    completeRequest,
    fetchRequests,
    createPhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber,
    markSMSSent,
    requestSMS,
    resetCurrentRequest
  };

  return (
    <SMSContext.Provider value={value}>
      {children}
    </SMSContext.Provider>
  );
};

const useSMS = () => {
  const context = useContext(SMSContext);
  if (context === undefined) {
    throw new Error('useSMS must be used within a SMSProvider');
  }
  return context;
};

export { SMSProvider, useSMS };

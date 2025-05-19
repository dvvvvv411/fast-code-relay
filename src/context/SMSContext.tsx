import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type SimulationStep = 'validating' | 'processing' | 'finalizing';
type RequestStatus = 'pending' | 'activated' | 'sms_requested' | 'completed';

interface Request {
  phone: string;
  accessCode: string;
  status: RequestStatus;
  smsCode?: string;
  simulationStep?: SimulationStep;
  simulationProgress?: number;
}

interface PhoneNumber {
  phone: string;
  accessCode: string;
  createdAt: Date;
}

interface SMSContextType {
  requests: Record<string, Request>;
  phoneNumbers: Record<string, PhoneNumber>;
  currentRequest: Request | null;
  submitRequest: (phone: string, accessCode: string) => void;
  activateRequest: (phone: string) => void;
  requestSMS: (phone: string) => void;
  submitSMSCode: (phone: string, smsCode: string) => void;
  getCurrentUserStatus: () => RequestStatus | null;
  // Phone number management functions
  createPhoneNumber: (phone: string, accessCode: string) => void;
  updatePhoneNumber: (oldPhone: string, newPhone: string, accessCode: string) => void;
  deletePhoneNumber: (phone: string) => void;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const SMSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, PhoneNumber>>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);

  // Handle simulation progression for pending requests
  useEffect(() => {
    if (currentRequest?.status === 'pending') {
      // Set initial simulation state
      const initialSimulationStep: SimulationStep = 'validating';
      const updatedRequest = {
        ...currentRequest,
        simulationStep: initialSimulationStep,
        simulationProgress: 0,
      };
      
      setCurrentRequest(updatedRequest);
      setRequests(prev => ({ ...prev, [currentRequest.phone]: updatedRequest }));
      
      // Progress simulation step
      const simulationTimers: NodeJS.Timeout[] = [];
      
      // Start simulation with validating step
      simulationTimers.push(setTimeout(() => {
        const progressUpdate = {
          ...updatedRequest,
          simulationProgress: 30,
        };
        setCurrentRequest(progressUpdate);
        setRequests(prev => ({ ...prev, [currentRequest.phone]: progressUpdate }));
      }, 2000));
      
      // Move to processing step
      simulationTimers.push(setTimeout(() => {
        const processingUpdate = {
          ...updatedRequest,
          simulationStep: 'processing' as SimulationStep,
          simulationProgress: 60,
        };
        setCurrentRequest(processingUpdate);
        setRequests(prev => ({ ...prev, [currentRequest.phone]: processingUpdate }));
      }, 5000));
      
      // Move to finalizing step
      simulationTimers.push(setTimeout(() => {
        const finalizingUpdate = {
          ...updatedRequest,
          simulationStep: 'finalizing' as SimulationStep,
          simulationProgress: 90,
        };
        setCurrentRequest(finalizingUpdate);
        setRequests(prev => ({ ...prev, [currentRequest.phone]: finalizingUpdate }));
      }, 8000));
      
      // Clean up timers when unmounting or status changes
      return () => {
        simulationTimers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [currentRequest?.status === 'pending' && !currentRequest.simulationStep]);

  const submitRequest = (phone: string, accessCode: string) => {
    const newRequest: Request = {
      phone,
      accessCode,
      status: 'pending',
    };
    
    setRequests((prev) => ({
      ...prev,
      [phone]: newRequest,
    }));
    
    setCurrentRequest(newRequest);
  };

  const activateRequest = (phone: string) => {
    if (requests[phone]) {
      const updatedRequest = {
        ...requests[phone],
        status: 'activated' as RequestStatus,
        // Clear simulation data on activation
        simulationStep: undefined,
        simulationProgress: 100,
      };
      
      setRequests((prev) => ({
        ...prev,
        [phone]: updatedRequest,
      }));
      
      if (currentRequest && currentRequest.phone === phone) {
        setCurrentRequest(updatedRequest);
      }
    }
  };

  const requestSMS = (phone: string) => {
    if (requests[phone]) {
      const updatedRequest = {
        ...requests[phone],
        status: 'sms_requested' as RequestStatus,
      };
      
      setRequests((prev) => ({
        ...prev,
        [phone]: updatedRequest,
      }));
      
      if (currentRequest && currentRequest.phone === phone) {
        setCurrentRequest(updatedRequest);
      }
    }
  };

  const submitSMSCode = (phone: string, smsCode: string) => {
    if (requests[phone]) {
      const updatedRequest = {
        ...requests[phone],
        status: 'completed' as RequestStatus,
        smsCode,
      };
      
      setRequests((prev) => ({
        ...prev,
        [phone]: updatedRequest,
      }));
      
      if (currentRequest && currentRequest.phone === phone) {
        setCurrentRequest(updatedRequest);
      }
    }
  };

  const getCurrentUserStatus = () => {
    return currentRequest ? currentRequest.status : null;
  };

  // Phone number management functions
  const createPhoneNumber = (phone: string, accessCode: string) => {
    const newPhoneNumber: PhoneNumber = {
      phone,
      accessCode,
      createdAt: new Date(),
    };
    
    setPhoneNumbers((prev) => ({
      ...prev,
      [phone]: newPhoneNumber,
    }));
  };

  const updatePhoneNumber = (oldPhone: string, newPhone: string, accessCode: string) => {
    if (phoneNumbers[oldPhone]) {
      const updatedPhoneNumber: PhoneNumber = {
        phone: newPhone,
        accessCode,
        createdAt: phoneNumbers[oldPhone].createdAt,
      };
      
      setPhoneNumbers((prev) => {
        const newPhoneNumbers = { ...prev };
        delete newPhoneNumbers[oldPhone];
        return {
          ...newPhoneNumbers,
          [newPhone]: updatedPhoneNumber,
        };
      });
    }
  };

  const deletePhoneNumber = (phone: string) => {
    if (phoneNumbers[phone]) {
      setPhoneNumbers((prev) => {
        const newPhoneNumbers = { ...prev };
        delete newPhoneNumbers[phone];
        return newPhoneNumbers;
      });
    }
  };

  return (
    <SMSContext.Provider
      value={{
        requests,
        phoneNumbers,
        currentRequest,
        submitRequest,
        activateRequest,
        requestSMS,
        submitSMSCode,
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

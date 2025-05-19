
import Header from '@/components/Header';
import UserForm from '@/components/UserForm';
import RequestStatus from '@/components/RequestStatus';
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SMS Code Relay</h1>
            <p className="text-gray-600">Geben Sie Ihre Informationen ein, um Ihre Nummer zu aktivieren</p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md form-container">
            <UserForm />
          </div>
          
          <RequestStatus />
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;

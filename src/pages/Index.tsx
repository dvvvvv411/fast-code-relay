
import Header from '@/components/Header';
import UserForm from '@/components/UserForm';
import RequestStatus from '@/components/RequestStatus';
import { Toaster } from "@/components/ui/toaster";
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Empfangen Sie jetzt Ihren <br className="hidden md:block" />
              <span className="text-orange-500">SMS</span> Code
            </h1>
            <p className="text-gray-600">
              Geben Sie die Informationen, die Sie in der E-Mail erhalten haben, ein und aktivieren Sie Ihre Nummer
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md form-container">
            <UserForm />
          </div>
          
          <RequestStatus />
        </div>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
};

export default Index;

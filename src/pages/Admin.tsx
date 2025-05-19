
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminPanel />
      </div>
    </div>
  );
};

export default Admin;

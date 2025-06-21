import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppointmentManager from './AppointmentManager';
import SMSDashboard from './SMSDashboard';
import EmploymentContractsAdmin from './EmploymentContractsAdmin';
import { 
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'sms' | 'employment-contracts'>('appointments');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('appointments')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap",
            activeTab === 'appointments' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Calendar className="h-4 w-4" />
          Terminverwaltung
        </button>
        
        <button
          onClick={() => setActiveTab('sms')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap",
            activeTab === 'sms' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          SMS-Verwaltung
        </button>
        
        <button
          onClick={() => setActiveTab('employment-contracts')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap",
            activeTab === 'employment-contracts' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <FileText className="h-4 w-4" />
          Arbeitsverträge
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'appointments' && <AppointmentManager />}
      {activeTab === 'sms' && <SMSDashboard />}
      {activeTab === 'employment-contracts' && <EmploymentContractsAdmin />}
    </div>
  );
};

export default AdminPanel;

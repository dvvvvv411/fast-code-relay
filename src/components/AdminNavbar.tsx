
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Phone, 
  Users, 
  FolderOpen, 
  LifeBuoy, 
  MessageCircle, 
  Mail, 
  Calendar,
  Star,
  FileText
} from 'lucide-react';

interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavbar = ({ activeTab, onTabChange }: AdminNavbarProps) => {
  const tabs = [
    { id: 'requests', label: 'Anfragen', icon: MessageSquare },
    { id: 'phones', label: 'Telefonnummern', icon: Phone },
    { id: 'uebersicht', label: 'Mitarbeiter-Übersicht', icon: Users },
    { id: 'auftraege', label: 'Aufträge', icon: FolderOpen },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'livechat', label: 'Live Chat', icon: MessageCircle },
    { id: 'mails', label: 'E-Mails', icon: Mail },
    { id: 'appointments', label: 'Termine', icon: Calendar },
    { id: 'contracts', label: 'Arbeitsverträge', icon: FileText },
    { id: 'feedback', label: 'Bewertungen', icon: Star },
  ];

  return (
    <div className="border rounded-lg p-1 bg-white shadow-sm">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "bg-orange hover:bg-orange/90 text-white" 
                  : "hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNavbar;

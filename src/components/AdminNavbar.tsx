
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  Briefcase, 
  MessageSquare, 
  Headphones, 
  Mail, 
  Calendar, 
  Star,
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavbar = ({ activeTab, onTabChange }: AdminNavbarProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const smsMenuItems = [
    { id: 'requests', label: 'SMS', icon: MessageSquare },
    { id: 'phones', label: 'Nummern', icon: Phone },
    { id: 'support', label: 'Support', icon: Headphones },
    { id: 'livechat', label: 'Live Chat', icon: MessageSquare },
  ];

  const auftraegeMenuItems = [
    { id: 'auftraege', label: 'Aufträge', icon: Briefcase },
    { id: 'mails', label: 'Mails', icon: Mail },
    { id: 'feedback', label: 'Bewertungen', icon: Star },
  ];

  const isActiveInGroup = (items: typeof smsMenuItems) => {
    return items.some(item => item.id === activeTab);
  };

  const handleDropdownClick = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center space-x-8">
          {/* SMS Aktivierung Dropdown */}
          <DropdownMenu 
            open={openDropdown === 'sms'} 
            onOpenChange={(open) => setOpenDropdown(open ? 'sms' : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  isActiveInGroup(smsMenuItems)
                    ? "bg-orange/10 text-orange hover:bg-orange/20"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => handleDropdownClick('sms')}
              >
                <MessageSquare className="h-4 w-4" />
                SMS Aktivierung
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white shadow-lg border border-gray-200">
              {smsMenuItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 cursor-pointer",
                    activeTab === item.id
                      ? "bg-orange/10 text-orange"
                      : "hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Aufträge Dropdown */}
          <DropdownMenu 
            open={openDropdown === 'auftraege'} 
            onOpenChange={(open) => setOpenDropdown(open ? 'auftraege' : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  isActiveInGroup(auftraegeMenuItems)
                    ? "bg-orange/10 text-orange hover:bg-orange/20"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => handleDropdownClick('auftraege')}
              >
                <Briefcase className="h-4 w-4" />
                Aufträge
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-white shadow-lg border border-gray-200">
              {auftraegeMenuItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 cursor-pointer",
                    activeTab === item.id
                      ? "bg-orange/10 text-orange"
                      : "hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Termine - Single Item */}
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              activeTab === 'appointments'
                ? "bg-orange/10 text-orange hover:bg-orange/20"
                : "text-gray-700 hover:bg-gray-100"
            )}
            onClick={() => onTabChange('appointments')}
          >
            <Calendar className="h-4 w-4" />
            Termine
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Phone, Users, Briefcase, Star, MessageCircle, HelpCircle, Calendar, UserPlus, FileText } from 'lucide-react';

interface AdminNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavbar = ({ activeTab, onTabChange }: AdminNavbarProps) => {
  const tabs = [
    { id: 'requests', label: 'Alle Anfragen', icon: MessageSquare },
    { id: 'phones', label: 'Telefonnummern', icon: Phone },
    { id: 'uebersicht', label: 'Mitarbeiter-Übersicht', icon: Users },
    { id: 'auftraege', label: 'Aufträge', icon: Briefcase },
    { id: 'evaluations', label: 'Bewertungen genehmigen', icon: Star },
    { id: 'feedback', label: 'Feedback-Übersicht', icon: MessageCircle },
    { id: 'support', label: 'Support Tickets', icon: HelpCircle },
    { id: 'livechat', label: 'Live Chat', icon: MessageSquare },
    { id: 'appointment-overview', label: 'Termine', icon: Calendar },
    { id: 'appointment-recipients', label: 'Terminempfänger', icon: UserPlus },
    { id: 'arbeitsvertrag', label: 'Arbeitsverträge', icon: FileText },
  ];

  return (
    <Tabs defaultValue={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-11">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id} 
            className={`flex flex-col items-center justify-center py-3 rounded-md text-sm font-medium 
                        data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground
                        transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className="h-5 w-5 mb-1" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {/* Content will be rendered in AdminPanel */}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default AdminNavbar;

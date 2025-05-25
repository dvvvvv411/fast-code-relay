
import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Auftrag, Anweisung } from '@/types/auftrag';
import AuftragTemplate from '@/components/AuftragTemplate';
import { Loader } from 'lucide-react';

const DynamicAuftrag = () => {
  const { id } = useParams<{ id: string }>();

  // Helper function to safely convert JSON to Anweisung array
  const convertJsonToAnweisungen = (jsonData: any): Anweisung[] => {
    if (!Array.isArray(jsonData)) return [];
    
    return jsonData.map((item: any) => ({
      id: item.id || '',
      title: item.title || '',
      content: item.content || '',
      icon: item.icon || undefined
    }));
  };

  const { data: auftrag, isLoading, error } = useQuery({
    queryKey: ['auftrag', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      
      const { data, error } = await supabase
        .from('auftraege')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Convert the data to proper Auftrag type with safe JSON conversion
      const convertedData: Auftrag = {
        ...data,
        anweisungen: convertJsonToAnweisungen(data.anweisungen)
      };
      
      return convertedData;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-500">Lade Auftrag...</p>
        </div>
      </div>
    );
  }

  if (error || !auftrag) {
    return <Navigate to="/404" replace />;
  }

  return <AuftragTemplate auftrag={auftrag} />;
};

export default DynamicAuftrag;

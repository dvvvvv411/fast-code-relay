
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserAssignment {
  id: string;
  auftrag_id: string;
  worker_first_name: string;
  worker_last_name: string;
  assignment_url: string;
  is_completed: boolean;
  is_evaluated: boolean;
  created_at: string;
  auftrag: {
    id: string;
    title: string;
    auftragsnummer: string;
    anbieter: string;
    projektziel: string;
  };
}

export const useUserAssignments = (userId?: string) => {
  return useQuery({
    queryKey: ['user-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log('🔍 Fetching assignments for user:', userId);
      
      const { data, error } = await supabase
        .from('auftrag_assignments')
        .select(`
          id,
          auftrag_id,
          worker_first_name,
          worker_last_name,
          assignment_url,
          is_completed,
          is_evaluated,
          created_at,
          auftraege:auftrag_id (
            id,
            title,
            auftragsnummer,
            anbieter,
            projektziel
          )
        `)
        .eq('assigned_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user assignments:', error);
        throw error;
      }

      console.log('📋 User assignments found:', data?.length || 0);
      return (data || []) as UserAssignment[];
    },
    enabled: !!userId,
  });
};

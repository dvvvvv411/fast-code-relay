
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
  assigned_user_id: string | null;
  status: string;
  evaluation_approved_at: string | null;
  evaluation_approved_by: string | null;
  created_at: string;
  auftrag: {
    id: string;
    title: string;
    auftragsnummer: string;
    anbieter: string;
    projektziel: string;
    bonus_amount: number;
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
          assigned_user_id,
          status,
          evaluation_approved_at,
          evaluation_approved_by,
          created_at,
          auftraege!inner (
            id,
            title,
            auftragsnummer,
            anbieter,
            projektziel,
            bonus_amount
          )
        `)
        .eq('assigned_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user assignments:', error);
        throw error;
      }

      console.log('📋 User assignments found:', data?.length || 0);
      
      // Map the data to match the UserAssignment interface
      const mappedData = (data || []).map(item => ({
        id: item.id,
        auftrag_id: item.auftrag_id,
        worker_first_name: item.worker_first_name,
        worker_last_name: item.worker_last_name,
        assignment_url: item.assignment_url,
        is_completed: item.is_completed,
        is_evaluated: item.is_evaluated,
        assigned_user_id: item.assigned_user_id,
        status: item.status,
        evaluation_approved_at: item.evaluation_approved_at,
        evaluation_approved_by: item.evaluation_approved_by,
        created_at: item.created_at,
        auftrag: {
          id: item.auftraege.id,
          title: item.auftraege.title,
          auftragsnummer: item.auftraege.auftragsnummer,
          anbieter: item.auftraege.anbieter,
          projektziel: item.auftraege.projektziel,
          bonus_amount: item.auftraege.bonus_amount || 0
        }
      }));

      return mappedData as UserAssignment[];
    },
    enabled: !!userId,
  });
};

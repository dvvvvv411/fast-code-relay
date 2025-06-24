
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserBonus {
  id: string;
  bonus_amount: number;
  awarded_at: string;
  status: 'pending' | 'paid' | 'cancelled';
  assignment_id: string;
  auftrag_assignments: {
    auftrag: {
      title: string;
      anbieter: string;
      auftragsnummer: string;
    };
  };
}

export const useUserBonuses = (userId?: string) => {
  return useQuery({
    queryKey: ['userBonuses', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_bonuses')
        .select(`
          id,
          bonus_amount,
          awarded_at,
          status,
          assignment_id,
          auftrag_assignments!inner (
            auftrag:auftraege!inner (
              title,
              anbieter,
              auftragsnummer
            )
          )
        `)
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bonuses:', error);
        throw error;
      }

      return data as UserBonus[];
    },
    enabled: !!userId,
  });
};

export const useUserBonusStats = (userId?: string) => {
  return useQuery({
    queryKey: ['userBonusStats', userId],
    queryFn: async () => {
      if (!userId) return { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };
      
      const { data, error } = await supabase
        .from('user_bonuses')
        .select('bonus_amount, status')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user bonus stats:', error);
        throw error;
      }

      // Only count paid bonuses for total amount
      const totalAmount = data
        .filter(bonus => bonus.status === 'paid')
        .reduce((sum, bonus) => sum + bonus.bonus_amount, 0);
      const paidAmount = data
        .filter(bonus => bonus.status === 'paid')
        .reduce((sum, bonus) => sum + bonus.bonus_amount, 0);
      const pendingAmount = data
        .filter(bonus => bonus.status === 'pending')
        .reduce((sum, bonus) => sum + bonus.bonus_amount, 0);
      const totalCount = data.length;

      return {
        totalAmount,
        paidAmount,
        pendingAmount,
        totalCount
      };
    },
    enabled: !!userId,
  });
};

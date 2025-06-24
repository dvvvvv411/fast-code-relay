
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface UserBankData {
  iban: string;
  bic: string | null;
}

export const useUserBankData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-bank-data', user?.id],
    queryFn: async (): Promise<UserBankData | null> => {
      if (!user) return null;

      console.log('🏦 Fetching bank data for user:', user.email);

      // First try to find by user_id
      let { data, error } = await supabase
        .from('employment_contracts')
        .select('iban, bic')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();

      // If no result by user_id, try by email
      if (!data && !error) {
        console.log('🔍 No contract found by user_id, trying by email:', user.email);
        const result = await supabase
          .from('employment_contracts')
          .select('iban, bic')
          .eq('email', user.email)
          .eq('status', 'accepted')
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error fetching bank data:', error);
        throw error;
      }

      console.log('✅ Bank data fetched:', data);
      return data;
    },
    enabled: !!user,
  });
};

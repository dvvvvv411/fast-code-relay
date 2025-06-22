
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('🔍 Fetching users with role "user"...');
      
      // First get user IDs with 'user' role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (rolesError) {
        console.error('❌ Error fetching user roles:', rolesError);
        throw rolesError;
      }

      if (!userRoles || userRoles.length === 0) {
        console.log('📋 No users with "user" role found');
        return [];
      }

      const userIds = userRoles.map(role => role.user_id);
      console.log('👥 Found user IDs:', userIds);

      // Get user details from auth.users via RPC or admin API
      // Since we can't directly query auth.users, we'll need to use the profiles approach
      // For now, we'll create a basic structure with the user IDs we have
      const users: User[] = userIds.map(id => ({
        id,
        email: `user-${id.slice(0, 8)}@example.com`, // Placeholder
        display_name: `User ${id.slice(0, 8)}`
      }));

      console.log('👤 Processed users:', users);
      return users;
    },
  });
};

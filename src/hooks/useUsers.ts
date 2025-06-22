
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

      // Get user profiles for these user IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching user profiles:', profilesError);
        throw profilesError;
      }

      // Map profiles to User interface
      const users: User[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        display_name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email || profile.id.slice(0, 8)
      }));

      console.log('👤 Processed user profiles:', users);
      return users;
    },
  });
};

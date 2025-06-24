
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserActivityStreak = (firstName?: string, lastName?: string) => {
  return useQuery({
    queryKey: ['userActivityStreak', firstName, lastName],
    queryFn: async () => {
      if (!firstName || !lastName) {
        return 0;
      }

      // Get all activity logs for this user, ordered by date (most recent first)
      const { data: activities, error } = await supabase
        .from('employee_activity_logs')
        .select('created_at')
        .eq('employee_first_name', firstName)
        .eq('employee_last_name', lastName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity logs:', error);
        return 0;
      }

      if (!activities || activities.length === 0) {
        return 0;
      }

      // Group activities by date (ignoring time)
      const activityDates = new Set<string>();
      activities.forEach(activity => {
        const date = new Date(activity.created_at).toDateString();
        activityDates.add(date);
      });

      // Convert to sorted array of dates (most recent first)
      const sortedDates = Array.from(activityDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => b.getTime() - a.getTime());

      if (sortedDates.length === 0) {
        return 0;
      }

      // Calculate consecutive days streak from the most recent activity
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      // Check if there's activity today or yesterday (to account for timezone differences)
      const mostRecentActivity = sortedDates[0];
      mostRecentActivity.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      // If last activity was more than 1 day ago, streak is 0
      if (daysDiff > 1) {
        return 0;
      }

      // Calculate consecutive days
      let currentDate = new Date(mostRecentActivity);
      for (let i = 0; i < sortedDates.length; i++) {
        const activityDate = sortedDates[i];
        activityDate.setHours(0, 0, 0, 0);

        if (activityDate.getTime() === currentDate.getTime()) {
          streak++;
          // Move to the previous day
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Gap found, break the streak
          break;
        }
      }

      return streak;
    },
    enabled: !!firstName && !!lastName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

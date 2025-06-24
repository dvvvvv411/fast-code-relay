
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useUserPhoneData = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhoneNumber = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Query to get phone number from appointment recipients through employment contract
        const { data, error: queryError } = await supabase
          .from('employment_contracts')
          .select(`
            appointment_id,
            appointments!inner (
              recipient_id,
              appointment_recipients!inner (
                phone_note
              )
            )
          `)
          .eq('email', user.email)
          .maybeSingle();

        if (queryError) {
          console.error('Error fetching phone data:', queryError);
          setError(queryError.message);
          return;
        }

        // Extract phone number from the nested data structure
        const phoneNote = data?.appointments?.appointment_recipients?.phone_note;
        setPhoneNumber(phoneNote || null);

      } catch (err) {
        console.error('Unexpected error fetching phone data:', err);
        setError('Fehler beim Laden der Telefonnummer');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoneNumber();
  }, [user?.email]);

  return {
    phoneNumber,
    isLoading,
    error
  };
};

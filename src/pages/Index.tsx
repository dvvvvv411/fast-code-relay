
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/auth', { replace: true });
  }, [navigate]);
  
  // Return null since we're redirecting immediately
  return null;
};

export default Index;

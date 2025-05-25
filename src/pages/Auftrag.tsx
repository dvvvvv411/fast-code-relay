
import { useParams } from 'react-router-dom';
import AuftragTemplate from '@/components/AuftragTemplate';

const Auftrag = () => {
  const { id } = useParams();
  
  return <AuftragTemplate auftragId={id} />;
};

export default Auftrag;

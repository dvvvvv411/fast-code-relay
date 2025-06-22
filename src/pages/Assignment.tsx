
import { useParams } from 'react-router-dom';
import AssignmentTemplate from '@/components/AssignmentTemplate';

const Assignment = () => {
  const { assignmentUrl } = useParams();
  
  return <AssignmentTemplate assignmentUrl={assignmentUrl} />;
};

export default Assignment;

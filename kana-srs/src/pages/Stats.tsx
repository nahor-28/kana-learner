import { useNavigate } from 'react-router-dom';
import { StatsDashboard } from '../components/StatsDashboard';

export function Stats() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center p-4">
        <button onClick={() => navigate('/')} className="text-sm opacity-50">
          ← Back
        </button>
      </div>
      <StatsDashboard />
    </div>
  );
}

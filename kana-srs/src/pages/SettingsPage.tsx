import { useNavigate } from 'react-router-dom';
import { Settings } from '../components/Settings';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center p-4">
        <button onClick={() => navigate('/')} className="text-sm opacity-50">
          ← Back
        </button>
      </div>
      <Settings />
    </div>
  );
}

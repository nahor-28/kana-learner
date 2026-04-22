import { useNavigate } from 'react-router-dom';
import type { SessionResult } from '../hooks/useSession';

interface Props {
  result: SessionResult;
}

export function SessionSummary({ result }: Props) {
  const navigate = useNavigate();
  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center gap-8 flex-1 px-6">
      <h2 className="text-3xl font-bold">Session complete!</h2>
      <div
        className="flex flex-col items-center gap-3 p-6 rounded-2xl w-full max-w-xs"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="text-center">
          <p className="text-4xl font-bold">{accuracy}%</p>
          <p className="text-sm opacity-60">accuracy</p>
        </div>
        <div className="w-full h-px opacity-10" style={{ background: '#fff' }} />
        <p className="text-lg">
          {result.correct} / {result.total} correct
        </p>
        {result.leeches.length > 0 && (
          <p className="text-sm opacity-60">
            {result.leeches.length} leech{result.leeches.length > 1 ? 'es' : ''} flagged
          </p>
        )}
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-medium"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          Home
        </button>
        <button
          onClick={() => navigate('/stats')}
          className="px-6 py-3 rounded-lg font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          View stats
        </button>
      </div>
    </div>
  );
}

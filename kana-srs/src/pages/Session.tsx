import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { NewCardIntro } from '../components/NewCardIntro';
import { QuizCard } from '../components/QuizCard';
import { SessionSummary } from '../components/SessionSummary';

const AUTO_ADVANCE_MS = 1200;

export function Session() {
  const navigate = useNavigate();
  const { phase, currentCard, lastCorrect, typedAnswer, result, startSession, submitAnswer, advance } =
    useSession();

  useEffect(() => {
    startSession();
  }, [startSession]);

  useEffect(() => {
    if (phase !== 'REVEAL') return;
    const timer = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [phase, advance]);

  if (phase === 'LOADING') {
    return (
      <div className="flex items-center justify-center flex-1 opacity-40">Loading session…</div>
    );
  }

  if (phase === 'SUMMARY') {
    return <SessionSummary result={result} />;
  }

  if (!currentCard) return null;

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate('/')} className="text-sm opacity-50">
          ← Back
        </button>
        <span className="text-sm opacity-50">
          {result.total > 0 && `${result.correct}/${result.total}`}
        </span>
      </div>

      {phase === 'INTRO_NEW' && (
        <NewCardIntro card={currentCard} onGotIt={advance} />
      )}

      {(phase === 'PROMPT' || phase === 'REVEAL') && (
        <QuizCard
          card={currentCard}
          phase={phase}
          lastCorrect={lastCorrect}
          typedAnswer={typedAnswer}
          onSubmit={submitAnswer}
        />
      )}
    </div>
  );
}

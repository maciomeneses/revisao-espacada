import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

type Phase = 'focus' | 'break';

export function Pomodoro() {
  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const skipPhase = useCallback(() => {
    clearTimer();
    setRunning(false);
    if (phase === 'focus') {
      setPhase('break');
      setSecondsLeft(BREAK_MINUTES * 60);
    } else {
      setPhase('focus');
      setSecondsLeft(FOCUS_MINUTES * 60);
    }
  }, [phase]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            skipPhase();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, skipPhase]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const label = phase === 'focus' ? 'Time to focus!' : 'Break time!';

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#b04040' }}>
      <div className="px-6 py-3 text-center text-sm font-medium text-white/90">{label}</div>
      <div className="mx-4 mb-2 rounded-lg bg-white/10 py-4 px-6">
        <div className="text-5xl font-bold text-white text-center tracking-widest">
          {mins}:{secs}
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 py-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="text-white hover:text-white/70 transition-colors"
          aria-label={running ? 'Pausar' : 'Iniciar'}
        >
          {running ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button
          onClick={skipPhase}
          className="text-white hover:text-white/70 transition-colors"
          aria-label="Pular"
        >
          <SkipForward size={22} />
        </button>
      </div>
    </div>
  );
}

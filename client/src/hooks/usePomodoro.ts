import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/services/api';
import { PomodoroState } from '@/types';

const DEFAULT_STATE: PomodoroState = {
  timeLeft: 25 * 60,
  isRunning: false,
  mode: 'work',
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  breaksEarned: 0
};

export const usePomodoro = () => {
  const [state, setState] = useState<PomodoroState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial sync from server
  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const serverState = await api.getPomoState();
        if (serverState) {
          const lastTick = serverState.lastTick ? parseInt(serverState.lastTick) : null;
          let timeLeft = serverState.timeLeft;
          
          if (serverState.isRunning && lastTick) {
            const elapsed = Math.floor((Date.now() - lastTick) / 1000);
            timeLeft = Math.max(0, serverState.timeLeft - elapsed);
          }

          setState({
            timeLeft,
            isRunning: !!serverState.isRunning,
            mode: serverState.mode as 'work' | 'break',
            workDuration: serverState.workDuration,
            breakDuration: serverState.breakDuration,
            breaksEarned: serverState.breaksEarned
          });
        }
      } catch (error) {
        console.error('Failed to sync from server:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServerState();
  }, []);

  // Sync to server (debounced)
  const syncToServer = useCallback((data: Partial<PomodoroState>, immediate = false) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    const performSync = async () => {
      try {
        const syncData = { ...data };
        if (data.isRunning) {
          syncData.lastTick = Date.now().toString();
        }
        await api.updatePomoState(syncData);
      } catch (error) {
        console.error('Failed to sync to server:', error);
      }
    };

    if (immediate) {
      performSync();
    } else {
      syncTimeoutRef.current = setTimeout(performSync, 5000); // Sync every 5 seconds if ticking
    }
  }, []);

  const onTimerComplete = useCallback(() => {
    setState(prev => {
      const isWork = prev.mode === 'work';
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(isWork ? 'Time for a break! 🍵' : 'Break over, let\'s focus! ⏳', {
          body: isWork ? 'You\'ve earned a tea break. Great job!' : 'Back to your quest. You got this!',
        });
      }

      // Log the session
      api.logFocusSession({
        timestamp: new Date().toISOString(),
        type: prev.mode,
        duration: Math.floor((isWork ? prev.workDuration : prev.breakDuration) / 60)
      });

      const newState: PomodoroState = {
        ...prev,
        isRunning: false,
        mode: 'work', // Always return to work mode after a break or work session
        breaksEarned: isWork ? prev.breaksEarned + 1 : prev.breaksEarned,
        timeLeft: prev.workDuration
      };

      syncToServer(newState, true);
      return newState;
    });
  }, [syncToServer]);

  useEffect(() => {
    if (loading) return;
    
    if (state.isRunning) {
      if (state.timeLeft <= 0) {
        onTimerComplete();
      } else {
        timerRef.current = setInterval(() => {
          setState(prev => {
            if (prev.timeLeft <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return { ...prev, timeLeft: 0 };
            }
            // Periodically sync time left to server (every 10 seconds)
            if (prev.timeLeft % 10 === 0) {
              syncToServer({ timeLeft: prev.timeLeft - 1, isRunning: true });
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRunning, state.timeLeft === 0, onTimerComplete, syncToServer, loading]);

  const toggleTimer = () => {
    setState(prev => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      syncToServer(newState, true);
      return newState;
    });
  };
  
  const resetTimer = () => {
    setState(prev => {
      const newState = {
        ...prev,
        isRunning: false,
        timeLeft: prev.mode === 'work' ? prev.workDuration : prev.breakDuration
      };
      syncToServer(newState, true);
      return newState;
    });
  };

  const setDuration = (type: 'work' | 'break', minutes: number) => {
    const seconds = minutes * 60;
    setState(prev => {
      const newState = { ...prev };
      if (type === 'work') {
        newState.workDuration = seconds;
        if (prev.mode === 'work' && !prev.isRunning) {
          newState.timeLeft = seconds;
        }
      } else {
        newState.breakDuration = seconds;
        if (prev.mode === 'break' && !prev.isRunning) {
          newState.timeLeft = seconds;
        }
      }
      syncToServer(newState, true);
      return newState;
    });
  };

  const takeBreak = () => {
    if (state.breaksEarned > 0) {
      setState(prev => {
        const newState = {
          ...prev,
          mode: 'break' as const,
          breaksEarned: prev.breaksEarned - 1,
          timeLeft: prev.breakDuration,
          isRunning: false
        };
        syncToServer(newState, true);
        return newState;
      });
    }
  };

  const returnToWork = () => {
    setState(prev => {
      const newState = {
        ...prev,
        mode: 'work' as const,
        timeLeft: prev.workDuration,
        isRunning: false
      };
      syncToServer(newState, true);
      return newState;
    });
  };

  const clearBreaks = () => {
    setState(prev => {
      const newState = { ...prev, breaksEarned: 0 };
      syncToServer(newState, true);
      return newState;
    });
  };

  return {
    state,
    loading,
    toggleTimer,
    resetTimer,
    setDuration,
    takeBreak,
    returnToWork,
    clearBreaks
  };
};

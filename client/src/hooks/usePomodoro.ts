import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';

interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  mode: 'work' | 'break';
  workDuration: number;
  breakDuration: number;
  breaksEarned: number;
}

export const usePomodoro = () => {
  const [state, setState] = useState<PomodoroState>({
    timeLeft: 25 * 60,
    isRunning: false,
    mode: 'work',
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    breaksEarned: 0
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Load saved settings
    const savedWork = localStorage.getItem('pomoWorkTime');
    const savedBreak = localStorage.getItem('pomoBreakTime');
    const savedEarned = localStorage.getItem('pomoBreaksEarned');
    
    if (savedWork || savedBreak || savedEarned) {
      setState(prev => ({
        ...prev,
        workDuration: savedWork ? parseInt(savedWork) : prev.workDuration,
        breakDuration: savedBreak ? parseInt(savedBreak) : prev.breakDuration,
        breaksEarned: savedEarned ? parseInt(savedEarned) : prev.breaksEarned,
        timeLeft: savedWork ? parseInt(savedWork) : prev.timeLeft
      }));
    }
  }, []);

  useEffect(() => {
    if (state.isRunning) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 0) {
            handleTimerComplete(prev);
            return prev;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRunning]);

  const handleTimerComplete = (currentState: PomodoroState) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(currentState.mode === 'work' ? 'Time for a break! 🍵' : 'Break over, let\'s focus! ⏳', {
        body: currentState.mode === 'work' ? 'You\'ve earned a tea break. Great job!' : 'Back to your quest. You got this!',
      });
    }

    if (currentState.mode === 'work') {
      const newEarned = currentState.breaksEarned + 1;
      localStorage.setItem('pomoBreaksEarned', newEarned.toString());
      
      api.logFocusSession({
        timestamp: new Date().toISOString(),
        type: 'work',
        duration: Math.floor(currentState.workDuration / 60)
      });

      setState(prev => ({
        ...prev,
        isRunning: false,
        breaksEarned: newEarned,
        timeLeft: prev.workDuration // Reset to work time or auto-break? Client.js resets to work
      }));
    } else {
      // Break ended
      setState(prev => ({
        ...prev,
        mode: 'work',
        isRunning: false,
        timeLeft: prev.workDuration
      }));
    }
  };

  const toggleTimer = () => setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  
  const resetTimer = () => setState(prev => ({
    ...prev,
    isRunning: false,
    timeLeft: prev.mode === 'work' ? prev.workDuration : prev.breakDuration
  }));

  const setDuration = (type: 'work' | 'break', minutes: number) => {
    const seconds = minutes * 60;
    if (type === 'work') {
      localStorage.setItem('pomoWorkTime', seconds.toString());
      setState(prev => ({ ...prev, workDuration: seconds, timeLeft: prev.mode === 'work' ? seconds : prev.timeLeft }));
    } else {
      localStorage.setItem('pomoBreakTime', seconds.toString());
      setState(prev => ({ ...prev, breakDuration: seconds, timeLeft: prev.mode === 'break' ? seconds : prev.timeLeft }));
    }
  };

  const takeBreak = () => {
    if (state.breaksEarned > 0) {
      const newEarned = state.breaksEarned - 1;
      localStorage.setItem('pomoBreaksEarned', newEarned.toString());
      setState(prev => ({
        ...prev,
        mode: 'break',
        breaksEarned: newEarned,
        timeLeft: prev.breakDuration,
        isRunning: true
      }));
    }
  };

  return {
    state,
    toggleTimer,
    resetTimer,
    setDuration,
    takeBreak
  };
};

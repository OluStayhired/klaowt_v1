// src/components/profile/BlueskyTimer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Pause, Play, RotateCcw, Plus, Minus, MoreVertical, Bell } from 'lucide-react';

interface BlueskyTimerProps {
  initialMinutes?: number;
  onTimeUp?: () => void;
  onTimeUpdate?: (remainingSeconds: number) => void;
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
}

export function BlueskyTimer({
  initialMinutes = 30,
  onTimeUp,
  onTimeUpdate,
  className = '',
  showControls = true,
  autoStart = false
}: BlueskyTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [showConfig, setShowConfig] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownFiveMinWarning, setHasShownFiveMinWarning] = useState(false);

  // Format time as HH:MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Reset timer to initial value
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
    setShowConfig(false);
    setHasShownFiveMinWarning(false);
  }, [initialMinutes]);

  // Time adjustment functions
  const adjustTime = useCallback((minutes: number) => {
    setTimeLeft(prev => {
      const newTime = Math.max(0, prev + (minutes * 60));
      setHasShownFiveMinWarning(false);
      return newTime;
    });
  }, []);

  // Show notification
  const showTimerNotification = useCallback(() => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000); // Hide after 5 seconds
  }, []);

  // Main timer effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          // Check for 5-minute warning
          if (newTime === 300 && !hasShownFiveMinWarning) { // 300 seconds = 5 minutes
            showTimerNotification();
            setHasShownFiveMinWarning(true);
          }
          
          // Call onTimeUpdate with new time
          onTimeUpdate?.(newTime);
          
          // Handle timer completion
          if (newTime <= 0) {
            clearInterval(intervalId!);
            setIsRunning(false);
            onTimeUp?.();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, onTimeUp, onTimeUpdate, hasShownFiveMinWarning, showTimerNotification]);

  // Click outside handler for config menu
  useEffect(() => {
    if (!showConfig) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.timer-config')) {
        setShowConfig(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConfig]);

  return (
    <div className="relative">
      {/* Notification Popup */}
      {showNotification && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
          <Bell className="w-4 h-4" />
          <span className="text-sm whitespace-nowrap">5 minutes remaining!</span>
        </div>
      )}

      {/* Timer Component */}
      <div className={`relative inline-flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1.5 ${className}`}>
        {/* Timer Icon */}
        <Timer className="w-4 h-4 text-blue-500" />
        
        {/* Time Display */}
        <span className={`font-mono font-medium text-sm ${timeLeft <= 300 ? 'text-red-500' : 'text-gray-700'}`}>
          {formatTime(timeLeft)}
        </span>
        
        {showControls && (
          <>
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              title={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5 text-yellow-600" />
              ) : (
                <Play className="w-3.5 h-3.5 text-blue-600" />
              )}
            </button>

            {/* Configuration Menu */}
            <div className="relative timer-config">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                title="Settings"
              >
                <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {/* Config Dropdown */}
              {showConfig && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Adjust Time</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => adjustTime(-5)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="Subtract 5 minutes"
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => adjustTime(5)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                          title="Add 5 minutes"
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetTimer}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                    Reset Timer
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

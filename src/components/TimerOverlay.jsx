// src/components/TimerOverlay.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { FaPause, FaCheck, FaExpand, FaCompress, FaClock } from 'react-icons/fa';

// Fungsi untuk memformat waktu dalam format mm:ss atau hh:mm:ss
const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return '00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper untuk mendapatkan waktu berlalu (dalam detik) dari waktu start
const getElapsedTimeInSeconds = (startTime) => {
  if (!startTime) return 0;
  return Math.floor((Date.now() - parseInt(startTime)) / 1000);
};

const TimerOverlay = () => {
  const { tasks, activeTimerId, pauseTimer, completeTask } = useTaskContext();
  const [activeTask, setActiveTask] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeUsed, setTimeUsed] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const timerIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(Date.now());
  const isInitializedRef = useRef(false);

  // Fungsi untuk sinkronisasi waktu dengan localStorage dan task data
  const syncTimeFromBackground = useCallback((task) => {
    if (!task || !task.isTimerRunning) return { timeRemaining: 0, timeUsed: 0 };
    
    const startTimestamp = localStorage.getItem('timerStartTimestamp');
    if (!startTimestamp) {
      return {
        timeRemaining: task.timeRemaining || 0,
        timeUsed: task.timeUsed || 0
      };
    }
    
    const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
    const baseTimeUsed = task.timeUsed || 0;
    const newTimeRemaining = Math.max(0, task.timeRemaining - elapsedSeconds);
    const newTimeUsed = baseTimeUsed + elapsedSeconds;
    
    return {
      timeRemaining: newTimeRemaining,
      timeUsed: newTimeUsed
    };
  }, []);

  // Listen for background timer updates dan timer-update events
  useEffect(() => {
    const handleBackgroundUpdate = (event) => {
      if (event.detail?.taskId === activeTimerId) {
        console.log('Background timer update received:', event.detail);
        setTimeRemaining(event.detail.timeRemaining);
        setTimeUsed(event.detail.timeUsed);
        lastSyncTimeRef.current = Date.now();
      }
    };

    const handleTimerUpdate = (event) => {
      if (event.detail?.taskId === activeTimerId) {
        console.log('Timer update received:', event.detail);
        setTimeRemaining(event.detail.timeRemaining);
        setTimeUsed(event.detail.timeUsed);
        lastSyncTimeRef.current = Date.now();
      }
    };
    
    window.addEventListener('background-timer-update', handleBackgroundUpdate);
    window.addEventListener('timer-update', handleTimerUpdate);
    
    return () => {
      window.removeEventListener('background-timer-update', handleBackgroundUpdate);
      window.removeEventListener('timer-update', handleTimerUpdate);
    };
  }, [activeTimerId]);
  
  // Mendapatkan task yang sedang aktif
  const findActiveTask = useCallback(() => {
    if (!activeTimerId) return null;
    
    let foundTask = null;
    
    Object.keys(tasks).forEach(day => {
      tasks[day].forEach(task => {
        if (task.id === activeTimerId && task.isTimerRunning) {
          foundTask = { ...task, day };
        }
      });
    });
    
    return foundTask;
  }, [activeTimerId, tasks]);
  
  // Cari task yang aktif dan sinkronisasi waktu
  useEffect(() => {
    const task = findActiveTask();
    setActiveTask(task);
    
    if (task) {
      // Cek apakah ada data waktu terbaru dari global store (TaskTimer)
      const globalTimer = window.timerStore?.getTimer(task.id);
      let syncedTimeRemaining = task.timeRemaining;
      let syncedTimeUsed = task.timeUsed || 0;
      
      if (globalTimer && globalTimer.isRunning) {
        // Gunakan data dari global store jika tersedia dan lebih akurat
        const elapsedSinceStore = getElapsedTimeInSeconds(globalTimer.startTime);
        syncedTimeRemaining = Math.max(0, globalTimer.timeRemaining - elapsedSinceStore);
        syncedTimeUsed = globalTimer.baseTimeUsed + elapsedSinceStore;
        
        console.log('Using global store data:', {
          globalTimer,
          elapsedSinceStore,
          syncedTimeRemaining,
          syncedTimeUsed
        });
      } else {
        // Fallback ke sinkronisasi dari localStorage
        const syncResult = syncTimeFromBackground(task);
        syncedTimeRemaining = syncResult.timeRemaining;
        syncedTimeUsed = syncResult.timeUsed;
        
        console.log('Using localStorage sync:', syncResult);
      }
      
      console.log('Task found, syncing time:', {
        originalTimeRemaining: task.timeRemaining,
        originalTimeUsed: task.timeUsed,
        syncedTimeRemaining,
        syncedTimeUsed
      });
      
      setTimeRemaining(syncedTimeRemaining);
      setTimeUsed(syncedTimeUsed);
      lastSyncTimeRef.current = Date.now();
      isInitializedRef.current = true;
      
      // Dispatch event untuk memastikan semua komponen tersinkronisasi
      window.dispatchEvent(new CustomEvent('timer-sync', {
        detail: {
          taskId: task.id,
          timeRemaining: syncedTimeRemaining,
          timeUsed: syncedTimeUsed
        }
      }));
    } else {
      // Reset jika tidak ada task aktif
      setTimeRemaining(0);
      setTimeUsed(0);
      isInitializedRef.current = false;
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [activeTimerId, tasks, findActiveTask, syncTimeFromBackground]);
  
  // Timer interval untuk update UI
  useEffect(() => {
    // Bersihkan interval yang ada
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (activeTask && activeTask.isTimerRunning && isInitializedRef.current) {
      // Update timer setiap detik
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastSync = Math.floor((now - lastSyncTimeRef.current) / 1000);
        
        // Update waktu berdasarkan waktu yang telah berlalu sejak sinkronisasi terakhir
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          return newTime;
        });
        
        setTimeUsed(prev => prev + 1);
        
        // Sinkronisasi ulang setiap 5 detik untuk mengoreksi drift dan memastikan akurasi
        if (timeSinceLastSync >= 5) {
          // Cek global store terlebih dahulu
          const globalTimer = window.timerStore?.getTimer(activeTask.id);
          let correctedTimeRemaining = timeRemaining;
          let correctedTimeUsed = timeUsed;
          
          if (globalTimer && globalTimer.isRunning) {
            // Gunakan data dari global store
            const elapsedSinceStore = getElapsedTimeInSeconds(globalTimer.startTime);
            correctedTimeRemaining = Math.max(0, globalTimer.timeRemaining - elapsedSinceStore);
            correctedTimeUsed = globalTimer.baseTimeUsed + elapsedSinceStore;
          } else {
            // Fallback ke localStorage
            const startTimestamp = localStorage.getItem('timerStartTimestamp');
            if (startTimestamp) {
              const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
              const baseTimeUsed = activeTask.timeUsed || 0;
              correctedTimeRemaining = Math.max(0, activeTask.timeRemaining - elapsedSeconds);
              correctedTimeUsed = baseTimeUsed + elapsedSeconds;
            }
          }
          
          console.log('Correcting timer drift:', {
            currentTimeRemaining: timeRemaining,
            currentTimeUsed: timeUsed,
            correctedTimeRemaining,
            correctedTimeUsed
          });
          
          // Hanya update jika ada perbedaan signifikan (> 2 detik)
          if (Math.abs(correctedTimeRemaining - timeRemaining) > 2 || 
              Math.abs(correctedTimeUsed - timeUsed) > 2) {
            setTimeRemaining(correctedTimeRemaining);
            setTimeUsed(correctedTimeUsed);
            
            // Dispatch event untuk sinkronisasi dengan komponen lain
            window.dispatchEvent(new CustomEvent('timer-sync', {
              detail: {
                taskId: activeTask.id,
                timeRemaining: correctedTimeRemaining,
                timeUsed: correctedTimeUsed
              }
            }));
          }
          
          lastSyncTimeRef.current = now;
        }
      }, 1000);
    }
    
    // Cleanup saat komponen unmount atau activeTask berubah
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeTask, activeTimerId]);
  
  // Handle visibility change dan mount - sinkronisasi saat tab menjadi visible lagi
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTask && activeTask.isTimerRunning) {
        console.log('Tab became visible, resyncing timer...');
        
        // Prioritaskan data dari global store
        const globalTimer = window.timerStore?.getTimer(activeTask.id);
        let syncedTimeRemaining, syncedTimeUsed;
        
        if (globalTimer && globalTimer.isRunning) {
          const elapsedSinceStore = getElapsedTimeInSeconds(globalTimer.startTime);
          syncedTimeRemaining = Math.max(0, globalTimer.timeRemaining - elapsedSinceStore);
          syncedTimeUsed = globalTimer.baseTimeUsed + elapsedSinceStore;
          
          console.log('Syncing from global store:', {
            globalTimer,
            elapsedSinceStore,
            syncedTimeRemaining,
            syncedTimeUsed
          });
        } else {
          // Fallback ke localStorage
          const syncResult = syncTimeFromBackground(activeTask);
          syncedTimeRemaining = syncResult.timeRemaining;
          syncedTimeUsed = syncResult.timeUsed;
          
          console.log('Syncing from localStorage:', syncResult);
        }
        
        setTimeRemaining(syncedTimeRemaining);
        setTimeUsed(syncedTimeUsed);
        lastSyncTimeRef.current = Date.now();
        
        console.log('Timer resynced after visibility change:', {
          syncedTimeRemaining,
          syncedTimeUsed
        });
      }
    };
    
    // Sinkronisasi saat mount juga
    if (activeTask && activeTask.isTimerRunning) {
      handleVisibilityChange();
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTask, syncTimeFromBackground]);
  
  // Efek untuk menghentikan timer jika waktu habis
  useEffect(() => {
    if (timeRemaining <= 0 && activeTask && isInitializedRef.current) {
      console.log('Timer completed, finishing task...');
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Gunakan setTimeout untuk memastikan completeTask tidak dipanggil selama rendering
      setTimeout(() => {
        completeTask(activeTask.id, activeTask.day);
      }, 0);
    }
  }, [timeRemaining, activeTask, completeTask]);

  // Handler untuk menjeda timer
  const handlePauseTimer = useCallback(() => {
    if (activeTask) {
      // Hitung waktu yang akurat saat pause
      const startTimestamp = localStorage.getItem('timerStartTimestamp');
      let correctedTimeRemaining = timeRemaining;
      
      if (startTimestamp) {
        const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
        correctedTimeRemaining = Math.max(0, activeTask.timeRemaining - elapsedSeconds);
      }
      
      console.log('Pausing timer with corrected time:', correctedTimeRemaining);
      pauseTimer(activeTask.id, correctedTimeRemaining, activeTask.day);
    }
  }, [activeTask, timeRemaining, pauseTimer]);

  // Handler untuk menandai task selesai
  const handleCompleteTask = useCallback(() => {
    if (activeTask && window.confirm(`Apakah Anda yakin ingin menyelesaikan tugas "${activeTask.title}"?`)) {
      completeTask(activeTask.id, activeTask.day);
    }
  }, [activeTask, completeTask]);

  // Handler untuk toggle minimize/maximize
  const handleToggleView = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);
  
  // Jika tidak ada task aktif, jangan tampilkan overlay
  if (!activeTask) {
    return null;
  }
  
  // Hitung persentase waktu tersisa dan waktu terpakai
  const totalSeconds = activeTask.duration * 60;
  const progressPercentage = Math.min(100, Math.max(0, (timeRemaining / totalSeconds) * 100));
  const usedPercentage = Math.min(100, Math.max(0, (timeUsed / totalSeconds) * 100));

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMinimized 
        ? 'bottom-20 right-4 max-w-[160px]' 
        : 'bottom-20 right-4 max-w-xs w-full md:w-72'
    }`}>
      {isMinimized ? (
        // Tampilan minimized
        <div 
          className="bg-blue-600 text-white rounded-lg shadow-lg p-2 flex items-center cursor-pointer"
          onClick={handleToggleView}
        >
          <div className="flex-1 mr-2 font-mono font-bold animate-pulse">
            {formatTime(timeRemaining)}
          </div>
          <button 
            className="p-1 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
            onClick={e => {
              e.stopPropagation();
              handleToggleView();
            }}
          >
            <FaExpand size={12} />
          </button>
        </div>
      ) : (
        // Tampilan penuh
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium truncate mr-2">{activeTask.title}</h3>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">{formatTime(timeRemaining)}</span>
              <button 
                onClick={handleToggleView}
                className="p-1 rounded-full hover:bg-blue-700 transition-colors focus:outline-none"
                aria-label="Minimize timer"
              >
                <FaCompress size={12} />
              </button>
            </div>
          </div>
          
          {/* Progress Bar dengan 2 indikator */}
          <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700">
            {/* Bar untuk waktu yang telah digunakan */}
            <div 
              className="absolute h-2 bg-green-500 transition-all duration-300 ease-linear"
              style={{ width: `${usedPercentage}%` }}
            ></div>
            
            {/* Overlay untuk waktu yang tersisa */}
            <div 
              className="relative h-2 bg-blue-500 opacity-30 transition-all duration-300 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Hari {activeTask.day}</span>
                <span className="mx-1">•</span>
                <span>{activeTask.duration} menit</span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <FaClock className="mr-1" size={10} />
                <span>
                  {Math.floor(timeUsed / 60)} / {activeTask.duration} menit
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {Math.floor(timeUsed / 60)} menit terpakai ({Math.round((timeUsed / totalSeconds) * 100)}%)
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={handlePauseTimer}
                  className="p-2 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors focus:outline-none"
                  aria-label="Jeda timer"
                >
                  <FaPause size={14} />
                </button>
                
                <button 
                  onClick={handleCompleteTask}
                  className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors focus:outline-none"
                  aria-label="Selesaikan tugas"
                >
                  <FaCheck size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerOverlay;
// src/components/TaskTimer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { FaPlay, FaPause, FaCheck, FaClock } from 'react-icons/fa';

// Fungsi untuk memformat waktu dalam format mm:ss atau hh:mm:ss
const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
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

// Membuat store singleton global yang tidak akan hilang saat navigasi
// Menggunakan window untuk memastikan state persisten di seluruh aplikasi
if (!window.timerStore) {
  window.timerStore = {
    timers: {},
    saveTimer: (taskId, data) => {
      window.timerStore.timers[taskId] = {
        ...window.timerStore.timers[taskId],
        ...data,
        lastUpdated: Date.now()
      };
    },
    getTimer: (taskId) => window.timerStore.timers[taskId] || null,
    removeTimer: (taskId) => {
      delete window.timerStore.timers[taskId];
    }
  };
}

const TaskTimer = ({ task }) => {
  const { startTimer, pauseTimer, completeTask, activeTimerId } = useTaskContext();
  const [displayTime, setDisplayTime] = useState(task?.timeRemaining || 0);
  const [displayUsedTime, setDisplayUsedTime] = useState(task?.timeUsed || 0);
  const [tickCount, setTickCount] = useState(0); // State untuk memaksa re-render


  const workerSyncRef = useRef(false);
  
  useEffect(() => {
    // Sync with the web worker when the component mounts if this task is running
    if (task.isTimerRunning && task.id === activeTimerId && !workerSyncRef.current) {
      // Subscribe to worker updates
      const handleWorkerUpdate = (event) => {
        if (event.detail?.taskId === task.id) {
          setDisplayTime(event.detail.timeRemaining);
          setDisplayUsedTime(event.detail.timeUsed);
        }
      };
      
      window.addEventListener('background-timer-update', handleWorkerUpdate);
      workerSyncRef.current = true;
      
      return () => {
        window.removeEventListener('background-timer-update', handleWorkerUpdate);
        workerSyncRef.current = false;
      };
    }
  }, [task.id, task.isTimerRunning, activeTimerId]);
  


  
  // Referensi untuk interval dan task
  const timerIntervalRef = useRef(null);
  const taskRef = useRef(task);
  
  // Update referensi task saat prop berubah
  useEffect(() => {
    taskRef.current = task;
  }, [task]);
  
  // Sinkronisasi dengan localStorage dan global store
  useEffect(() => {
    const syncFromGlobalState = () => {
      // Task yang sedang aktif (timer berjalan)
      if (task.isTimerRunning) {
        // Cek jika timer ini adalah activeTimer di localStorage
        const currentActiveId = localStorage.getItem('activeTimerId');
        const startTimestamp = localStorage.getItem('timerStartTimestamp');
        
        if (currentActiveId === task.id && startTimestamp) {
          // Hitung waktu terpakai dan waktu tersisa
          const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
          const baseTimeUsed = task.timeUsed || 0;
          const totalTimeUsed = baseTimeUsed + elapsedSeconds;
          
          // Simpan ke global store
          window.timerStore.saveTimer(task.id, {
            startTime: parseInt(startTimestamp),
            baseTimeUsed,
            timeRemaining: task.timeRemaining,
            isRunning: true
          });
          
          // Update display
          setDisplayTime(Math.max(0, task.timeRemaining - elapsedSeconds));
          setDisplayUsedTime(totalTimeUsed);
        } else {
          // Coba ambil dari global store
          const storedTimer = window.timerStore.getTimer(task.id);
          if (storedTimer && storedTimer.isRunning) {
            const elapsedSinceStore = getElapsedTimeInSeconds(storedTimer.startTime);
            const totalTimeUsed = storedTimer.baseTimeUsed + elapsedSinceStore;
            const remainingTime = Math.max(0, storedTimer.timeRemaining - elapsedSinceStore);
            
            // Update display
            setDisplayTime(remainingTime);
            setDisplayUsedTime(totalTimeUsed);
          } else {
            // Fallback ke nilai awal
            setDisplayTime(task.timeRemaining);
            setDisplayUsedTime(task.timeUsed || 0);
          }
        }
      } else {
        // Task tidak aktif, tampilkan data dari task
        setDisplayTime(task.timeRemaining);
        setDisplayUsedTime(task.timeUsed || 0);
        
        // Hapus dari global store jika ada
        if (window.timerStore.getTimer(task.id)?.isRunning) {
          window.timerStore.saveTimer(task.id, {
            isRunning: false,
            timeRemaining: task.timeRemaining,
            baseTimeUsed: task.timeUsed || 0
          });
        }
      }
    };
    
    // Jalankan sinkronisasi
    syncFromGlobalState();
    
    // Interval timer untuk UI
    if (task.isTimerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        const currentTask = taskRef.current;
        if (!currentTask || !currentTask.isTimerRunning) {
          clearInterval(timerIntervalRef.current);
          return;
        }
        
        const storedTimer = window.timerStore.getTimer(currentTask.id);
        const startTime = storedTimer?.startTime || 
                          (localStorage.getItem('activeTimerId') === currentTask.id ? 
                           parseInt(localStorage.getItem('timerStartTimestamp')) : null);
        
        if (startTime) {
          const elapsedSeconds = getElapsedTimeInSeconds(startTime);
          const baseTimeUsed = storedTimer?.baseTimeUsed || currentTask.timeUsed || 0;
          const totalTimeUsed = baseTimeUsed + elapsedSeconds;
          const remainingTime = Math.max(0, currentTask.timeRemaining - elapsedSeconds);
          
          // Update display
          setDisplayTime(remainingTime);
          setDisplayUsedTime(totalTimeUsed);
          
          // Memaksa re-render untuk animasi
          setTickCount(prev => prev + 1);
        }
      }, 1000);
    }
    
    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [task.id, task.isTimerRunning, task.timeRemaining, task.timeUsed]);
  
  // Event listener untuk sinkronisasi antar komponen
  useEffect(() => {
    const handleTimerUpdate = (event) => {
      // Hanya tangani event untuk task ini
      if (event.detail?.taskId === task.id) {
        const { timeRemaining, timeUsed } = event.detail;
        setDisplayTime(timeRemaining);
        setDisplayUsedTime(timeUsed);
      }
    };
    
    // Register event listener
    window.addEventListener('timer-update', handleTimerUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('timer-update', handleTimerUpdate);
    };
  }, [task.id]);
  
  // Handler untuk toggle timer
  const handleToggleTimer = useCallback(() => {
    if (task.isTimerRunning) {
      pauseTimer(task.id, displayTime, task.day);
      
      // Update global store
      window.timerStore.saveTimer(task.id, {
        isRunning: false,
        timeRemaining: displayTime,
        baseTimeUsed: displayUsedTime
      });
    } else {
      startTimer(task.id, task.day, task.timeRemaining);
      
      // Update global store
      const startTime = Date.now();
      window.timerStore.saveTimer(task.id, {
        startTime,
        isRunning: true,
        timeRemaining: task.timeRemaining,
        baseTimeUsed: task.timeUsed || 0
      });
    }
  }, [task, displayTime, displayUsedTime, startTimer, pauseTimer]);
  
  // Handler untuk menyelesaikan task
  const handleCompleteTask = useCallback(() => {
    if (window.confirm(`Apakah Anda yakin ingin menyelesaikan tugas "${task.title}"?`)) {
      completeTask(task.id, task.day);
      
      // Hapus dari global store
      window.timerStore.removeTimer(task.id);
    }
  }, [task, completeTask]);
  
  // Hitung persentase waktu yang tersisa untuk progress bar
  const totalSeconds = task.duration * 60;
  const progressPercentage = Math.min(100, Math.max(0, (displayTime / totalSeconds) * 100));
  
  // Hitung persentase waktu yang telah digunakan
  const usedPercentage = Math.min(100, Math.max(0, (displayUsedTime / totalSeconds) * 100));
  
  // Tentukan status timer
  const isActive = task.isTimerRunning;
  const isPaused = !isActive && task.startedAt && !task.isDone;
  
  // Cek apakah timer lain sedang aktif
  const otherTimerActive = activeTimerId && activeTimerId !== task.id;

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-all duration-300 hover:shadow-md ${
        isActive ? 'border-l-4 border-blue-500' : ''
      }`}
      data-task-id={task.id}
      data-tick={tickCount} // Membantu debug
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">
          {task.title}
          {isActive && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              Aktif
            </span>
          )}
        </h3>
        <div className="flex flex-col items-end">
          <span className={`font-mono text-sm px-2 py-0.5 rounded-md ${
            isActive 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 animate-pulse' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {formatTime(displayTime)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Sisa waktu
          </span>
        </div>
      </div>
      
      {/* Progress bar dengan dual indicator */}
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
        {/* Bar untuk waktu yang telah digunakan */}
        <div 
          className={`absolute left-0 h-2.5 rounded-full transition-all duration-300 ease-in-out ${
            isActive
              ? 'bg-green-500 dark:bg-green-600'
              : isPaused
                ? 'bg-yellow-500 dark:bg-yellow-600'
                : 'bg-green-400 dark:bg-green-600'
          }`}
          style={{ width: `${usedPercentage}%` }}
        ></div>
        
        {/* Bar untuk waktu yang tersisa */}
        <div 
          className={`relative h-2.5 rounded-full transition-all duration-300 ease-in-out opacity-30 ${
            isActive
              ? 'bg-blue-600 dark:bg-blue-500'
              : isPaused
                ? 'bg-yellow-500 dark:bg-yellow-600'
                : 'bg-gray-400 dark:bg-gray-600'
          }`}
          style={{ width: `${progressPercentage}%`, float: 'right' }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <FaClock className="mr-1" size={10} />
            <span className={displayUsedTime > 0 ? "font-medium" : ""}>
              {Math.floor(displayUsedTime / 60)}
            </span>
            <span className="text-gray-400 mx-1">/</span>
            <span>{task.duration} menit terpakai</span>
          </div>
          
          {isActive && (
            <span className="ml-1 text-blue-500 dark:text-blue-400">
              Berjalan
            </span>
          )}
          {isPaused && (
            <span className="ml-1 text-yellow-500 dark:text-yellow-400">
              Dijeda
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {/* Tombol Toggle Timer (Play/Pause) */}
          <button
            onClick={handleToggleTimer}
            disabled={task.isDone || (otherTimerActive && !task.isTimerRunning)}
            className={`play-button p-2 rounded-full transition-colors ${
              isActive
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                : otherTimerActive && !task.isTimerRunning
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
            }`}
            aria-label={isActive ? "Jeda timer" : "Mulai timer"}
          >
            {isActive ? <FaPause size={14} /> : <FaPlay size={14} />}
          </button>
          
          {/* Tombol Selesai */}
          <button
            onClick={handleCompleteTask}
            disabled={task.isDone}
            className={`p-2 rounded-full transition-colors ${
              task.isDone
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
            }`}
            aria-label="Tandai selesai"
          >
            <FaCheck size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTimer;
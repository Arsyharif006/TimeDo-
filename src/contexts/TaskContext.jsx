// src/contexts/TaskContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import NotificationService from '../utils/NotificationService';

// Membuat context
const TaskContext = createContext();

// Custom hook untuk menggunakan context
export const useTaskContext = () => useContext(TaskContext);

// Mengambil nama hari dalam bahasa Indonesia
const getDayName = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

// Struktur data awal
const initialTasksState = {
  Senin: [],
  Selasa: [],
  Rabu: [],
  Kamis: [],
  Jumat: [],
  Sabtu: [],
  Minggu: []
};

// Helper untuk mendapatkan waktu berlalu (dalam detik) dari waktu start
const getElapsedTimeInSeconds = (startTime) => {
  if (!startTime) return 0;
  return Math.floor((Date.now() - parseInt(startTime)) / 1000);
};

export const TaskProvider = ({ children }) => {
  // State untuk menyimpan tugas
  const [tasks, setTasks] = useState(() => {
    // Coba ambil dari localStorage saat inisialisasi
    try {
      const savedTasks = localStorage.getItem('todoTasks');
      return savedTasks ? JSON.parse(savedTasks) : initialTasksState;
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
      return initialTasksState;
    }
  });

  // State untuk dark mode
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode ? JSON.parse(savedMode) : false;
    } catch (error) {
      return false;
    }
  });

  // State untuk active timer ID
  const [activeTimerId, setActiveTimerId] = useState(() => {
    try {
      return localStorage.getItem('activeTimerId') || null;
    } catch (error) {
      return null;
    }
  });

  // State untuk waktu background
  const [backgroundTime, setBackgroundTime] = useState(0);

  // Mendapatkan hari ini
  const today = getDayName();
  const currentDate = dayjs().format('YYYY-MM-DD');

  // Simpan data tasks ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem('todoTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
      toast.error("Gagal menyimpan data");
    }
  }, [tasks]);

  // Simpan setting dark mode ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      
      // Terapkan dark mode ke dokumen
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error("Error saving dark mode to localStorage:", error);
    }
  }, [darkMode]);

  // Fungsi untuk update task
  const updateTask = useCallback((taskId, updatedData, day) => {
    setTasks(prevTasks => {
      // Pastikan day dan task ada
      if (!prevTasks[day]) return prevTasks;
      
      const taskIndex = prevTasks[day].findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;
      
      // Buat salinan state untuk update yang aman
      const newTasks = {...prevTasks};
      const newDayTasks = [...newTasks[day]];
      
      // Update task yang diinginkan
      newDayTasks[taskIndex] = {
        ...newDayTasks[taskIndex],
        ...updatedData
      };
      
      newTasks[day] = newDayTasks;
      return newTasks;
    });
  }, []);

  // Efek untuk menangani inisialisasi dan pengecekan timer aktif
  useEffect(() => {
    const initializeTimers = () => {
      // Cek apakah ada timer aktif di localStorage
      const savedActiveTimerId = localStorage.getItem('activeTimerId');
      const startTimestamp = localStorage.getItem('timerStartTimestamp');
      
      if (savedActiveTimerId && startTimestamp) {
        // Cari task aktif di seluruh hari
        let foundTask = null;
        let foundDay = null;
        
        Object.keys(tasks).forEach(day => {
          const activeTask = tasks[day].find(task => task.id === savedActiveTimerId);
          if (activeTask) {
            foundTask = activeTask;
            foundDay = day;
          }
        });
        
        // Jika task ditemukan, perbarui timeRemaining berdasarkan waktu yang telah berlalu
        if (foundTask && foundDay) {
          const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
          const updatedTimeRemaining = Math.max(0, foundTask.timeRemaining - elapsedSeconds);
          
          // Update task
          setTasks(prevTasks => {
            // Buat salinan state
            const newTasks = { ...prevTasks };
            const newDayTasks = [ ...newTasks[foundDay] ];
            
            // Update task yang ditemukan
            const taskIndex = newDayTasks.findIndex(t => t.id === savedActiveTimerId);
            if (taskIndex !== -1) {
              // Jika waktu habis, tandai selesai
              if (updatedTimeRemaining <= 0) {
                // Hitung waktu yang telah digunakan
                const totalTimeUsed = (newDayTasks[taskIndex].timeUsed || 0) + elapsedSeconds;
                
                newDayTasks[taskIndex] = {
                  ...newDayTasks[taskIndex],
                  isDone: true,
                  isTimerRunning: false,
                  finishedAt: new Date().toISOString(),
                  lastCompletedDate: currentDate,
                  timeRemaining: 0,
                  timeUsed: totalTimeUsed,
                  actualCompletedTime: totalTimeUsed // Catat waktu yang benar-benar diselesaikan (dalam detik)
                };
                
                // Reset active timer
                setActiveTimerId(null);
                localStorage.removeItem('activeTimerId');
                localStorage.removeItem('timerStartTimestamp');
                
                setTimeout(() => {
                  toast.success(`Tugas "${newDayTasks[taskIndex].title}" selesai!`);
                }, 500);
              } else {
                // Update timeRemaining, timeUsed dan pastikan isTimerRunning = true
                const currentTimeUsed = newDayTasks[taskIndex].timeUsed || 0;
                
                newDayTasks[taskIndex] = {
                  ...newDayTasks[taskIndex],
                  isTimerRunning: true,
                  timeRemaining: updatedTimeRemaining,
                  timeUsed: currentTimeUsed + elapsedSeconds
                };
                
                // Set active timer ID
                setActiveTimerId(savedActiveTimerId);
                
                // Perbarui waktu mulai
                localStorage.setItem('timerStartTimestamp', Date.now().toString());
              }
            }
            
            newTasks[foundDay] = newDayTasks;
            return newTasks;
          });
        } else {
          // Task tidak ditemukan, bersihkan localStorage
          localStorage.removeItem('activeTimerId');
          localStorage.removeItem('timerStartTimestamp');
        }
      }
    };
    
    // Jalankan inisialisasi
    initializeTimers();
  }, []);

  // Efek untuk menangani perubahan visibilitas halaman
  useEffect(() => {
    const handleVisibilityChange = () => {
      const savedActiveTimerId = localStorage.getItem('activeTimerId');
      const startTimestamp = localStorage.getItem('timerStartTimestamp');
      
      if (savedActiveTimerId && startTimestamp) {
        if (!document.hidden) { // Tab menjadi visible
          // Hitung waktu yang telah berlalu dan update timer
          const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
          console.log(`Tab visible again. Elapsed time: ${elapsedSeconds}s`);
          
          // Catat waktu untuk perhitungan berikutnya
          setBackgroundTime(prev => prev + elapsedSeconds);
          
          // Perbarui timestamp mulai
          localStorage.setItem('timerStartTimestamp', Date.now().toString());
          
          // Temukan dan update task
          let foundTask = null;
          let foundDay = null;
          
          Object.keys(tasks).forEach(day => {
            const activeTask = tasks[day].find(task => task.id === savedActiveTimerId);
            if (activeTask) {
              foundTask = activeTask;
              foundDay = day;
            }
          });
          
          if (foundTask && foundDay) {
            const updatedTimeRemaining = Math.max(0, foundTask.timeRemaining - elapsedSeconds);
            const currentTimeUsed = foundTask.timeUsed || 0;
            
            // Update task
            updateTask(
              savedActiveTimerId, 
              { 
                timeRemaining: updatedTimeRemaining,
                timeUsed: currentTimeUsed + elapsedSeconds
              }, 
              foundDay
            );
            
            // Jika timer habis, selesaikan task
            if (updatedTimeRemaining <= 0) {
              completeTask(savedActiveTimerId, foundDay);
            }
          }
        } else { // Tab menjadi hidden
          // Tidak perlu menghentikan timer, hanya perlu memastikan startTimestamp diperbarui
          localStorage.setItem('timerStartTimestamp', Date.now().toString());
        }
      }
    };
    
    // Pasang event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tasks]);
  
  // Interval untuk update timer aktif secara periodik
  useEffect(() => {
    let backgroundInterval;
    
    if (activeTimerId) {
      // Update timer setiap 30 detik jika dalam background
      backgroundInterval = setInterval(() => {
        const startTimestamp = localStorage.getItem('timerStartTimestamp');
        
        if (startTimestamp && document.hidden) {
          // Tab sedang dalam background, update task
          const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
          
          // Perbarui timestamp mulai
          localStorage.setItem('timerStartTimestamp', Date.now().toString());
          
          // Temukan dan update task
          Object.keys(tasks).forEach(day => {
            tasks[day].forEach(task => {
              if (task.id === activeTimerId && task.isTimerRunning) {
                const updatedTimeRemaining = Math.max(0, task.timeRemaining - elapsedSeconds);
                const currentTimeUsed = task.timeUsed || 0;
                
                // Update task dalam background
                updateTask(
                  activeTimerId, 
                  { 
                    timeRemaining: updatedTimeRemaining,
                    timeUsed: currentTimeUsed + elapsedSeconds
                  }, 
                  day
                );
                
                // Jika timer habis, selesaikan task
                if (updatedTimeRemaining <= 0) {
                  completeTask(activeTimerId, day);
                }
              }
            });
          });
        }
      }, 30000); // 30 detik interval
    }
    
    return () => {
      if (backgroundInterval) {
        clearInterval(backgroundInterval);
      }
    };
  }, [activeTimerId, tasks]);

  const addTask = useCallback((day, title, duration) => {
    if (!title.trim()) {
      toast.error("Judul tugas tidak boleh kosong");
      return null;
    }
    
    if (parseInt(duration, 10) <= 0) {
      toast.error("Durasi harus lebih dari 0 menit");
      return null;
    }
    
    const newTask = {
      id: uuidv4(),
      title: title.trim(),
      duration: parseInt(duration, 10),
      isDone: false,
      day,
      isTimerRunning: false,
      timeRemaining: parseInt(duration, 10) * 60, // Convert to seconds
      timeUsed: 0, // Catat waktu yang sudah digunakan (dalam detik)
      startedAt: null,
      finishedAt: null,
      lastCompletedDate: null,
      actualCompletedTime: 0 // Waktu yang benar-benar diselesaikan (dalam detik)
    };
  
    setTasks(prevTasks => ({
      ...prevTasks,
      [day]: [...(prevTasks[day] || []), newTask]
    }));
  
    // Kirim notifikasi tugas ditambahkan (optional)
    if (Notification.permission === 'granted') {
      NotificationService.taskAdded(title, day);
    }
  
    toast.success(`Tugas "${title}" ditambahkan untuk hari ${day}`);
    return newTask.id;
  }, []);
  

  // Fungsi untuk menghapus tugas
  const deleteTask = useCallback((taskId, day) => {
    setTasks(prevTasks => {
      if (!prevTasks[day]) return prevTasks;
      
      const taskToDelete = prevTasks[day].find(task => task.id === taskId);
      if (!taskToDelete) return prevTasks;
      
      // Jika tugas yang dihapus sedang berjalan, bersihkan active timer
      if (taskToDelete.isTimerRunning) {
        setActiveTimerId(null);
        localStorage.removeItem('activeTimerId');
        localStorage.removeItem('timerStartTimestamp');
      }
      
      return {
        ...prevTasks,
        [day]: prevTasks[day].filter(task => task.id !== taskId)
      };
    });
    
    setTimeout(() => {
      toast.success(`Tugas dihapus`);
    }, 0);
  }, []);

  const completeTask = useCallback((taskId, day) => {
    setTasks(prevTasks => {
      if (!prevTasks[day]) return prevTasks;
      
      const taskIndex = prevTasks[day].findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;
      
      const task = prevTasks[day][taskIndex];
      const totalDurationSeconds = task.duration * 60;
      
      // Stop timer notification jika ada
      NotificationService.stopTimerNotification(taskId);
      
      // Hitung waktu yang benar-benar digunakan
      let actualTimeUsed = task.timeUsed || 0;
      
      // Jika timer sedang berjalan, tambahkan waktu dari sesi ini
      if (task.isTimerRunning && activeTimerId === taskId) {
        const startTimestamp = localStorage.getItem('timerStartTimestamp');
        if (startTimestamp) {
          const elapsedSeconds = Math.floor((Date.now() - parseInt(startTimestamp)) / 1000);
          actualTimeUsed += elapsedSeconds;
        }
      }
      
      // Kirim notifikasi tugas selesai
      NotificationService.taskCompleted(task.title);
      
      // Buat salinan state untuk update yang aman
      const newTasks = {...prevTasks};
      const newDayTasks = [...newTasks[day]];
      
      // Update task yang diinginkan
      newDayTasks[taskIndex] = {
        ...newDayTasks[taskIndex],
        isDone: true,
        isTimerRunning: false,
        finishedAt: new Date().toISOString(),
        lastCompletedDate: currentDate,
        timeRemaining: 0,
        timeUsed: actualTimeUsed,
        actualCompletedTime: actualTimeUsed // Catat waktu yang benar-benar diselesaikan (dalam detik)
      };
      
      newTasks[day] = newDayTasks;
      
      // Jika tugas ini adalah active timer, reset active timer
      if (activeTimerId === taskId) {
        setActiveTimerId(null);
        localStorage.removeItem('activeTimerId');
        localStorage.removeItem('timerStartTimestamp');
      }
      
      return newTasks;
    });
    
    setTimeout(() => {
      toast.success(`Tugas selesai!`);
    }, 0);
  }, [activeTimerId, currentDate]);


  // Fungsi untuk mendapatkan tugas hari ini
  const getTodayTasks = useCallback(() => {
    if (!tasks[today]) return [];
    
    return tasks[today].filter(task => 
      !task.lastCompletedDate || task.lastCompletedDate !== currentDate
    );
  }, [tasks, today, currentDate]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
    toast.success(!darkMode ? 'Mode gelap diaktifkan' : 'Mode terang diaktifkan');
  }, [darkMode]);

  // Reset semua data
  const resetAllData = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.")) {
      setTasks(initialTasksState);
      setActiveTimerId(null);
      localStorage.removeItem('activeTimerId');
      localStorage.removeItem('timerStartTimestamp');
      setBackgroundTime(0);
      toast.success('Semua data berhasil dihapus');
    }
  }, []);

  // Export data sebagai JSON
  const exportData = useCallback(() => {
    try {
      const dataStr = JSON.stringify(tasks, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `todo-list-${dayjs().format('YYYY-MM-DD')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Data berhasil diekspor');
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Gagal mengekspor data");
    }
  }, [tasks]);

  // Menghitung statistik tugas
  const getStatistics = useCallback(() => {
    const byDay = Object.keys(tasks).reduce((stats, day) => {
      const dayTasks = tasks[day] || [];
      const completedTasks = dayTasks.filter(task => task.isDone).length;
      const totalTasks = dayTasks.length;
      
      stats[day] = {
        total: totalTasks,
        completed: completedTasks,
        incomplete: totalTasks - completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      };
      
      return stats;
    }, {});
    
    const allTasks = Object.values(tasks).flat();
    const totalTasksAll = allTasks.length;
    const completedTasksAll = allTasks.filter(task => task.isDone).length;
    
    return {
      byDay,
      global: {
        total: totalTasksAll,
        completed: completedTasksAll,
        incomplete: totalTasksAll - completedTasksAll,
        completionRate: totalTasksAll > 0 ? (completedTasksAll / totalTasksAll) * 100 : 0
      }
    };
  }, [tasks]);

  // Fungsi untuk menghitung statistik mingguan
  const getWeeklyStats = useCallback(() => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const weeklyData = {
      totalAllocatedTime: 0,
      totalCompletedTime: 0,
      days: {}
    };

    // Inisialisasi data per hari
    days.forEach(day => {
      weeklyData.days[day] = {
        allocatedTime: 0,
        completedTime: 0,
        tasks: []
      };
    });

    // Hitung statistik untuk setiap hari
    Object.keys(tasks).forEach(day => {
      tasks[day].forEach(task => {
        const allocatedTime = task.duration; // dalam menit
        
        // Hitung waktu yang diselesaikan
        let completedTime = 0;
        if (task.isDone) {
          // Jika tugas selesai, gunakan waktu aktual yang diselesaikan
          const actualTimeInSeconds = task.actualCompletedTime || task.timeUsed || 0;
          completedTime = Math.round(actualTimeInSeconds / 60); // konversi ke menit
        } else if (task.isTimerRunning || task.timeUsed > 0) {
          // Jika tugas sedang berjalan atau pernah dimulai, hitung berdasarkan waktu yang digunakan
          const timeUsedInSeconds = task.timeUsed || 0;
          
          // Jika timer sedang berjalan, tambahkan waktu yang berlalu sejak timer dimulai
          let additionalTimeUsed = 0;
          if (task.isTimerRunning && task.id === activeTimerId) {
            const startTimestamp = localStorage.getItem('timerStartTimestamp');
            if (startTimestamp) {
              additionalTimeUsed = getElapsedTimeInSeconds(startTimestamp);
            }
          }
          
          const totalTimeUsed = timeUsedInSeconds + additionalTimeUsed;
          completedTime = Math.round(totalTimeUsed / 60); // konversi ke menit
        }
        
        // Batasi waktu yang diselesaikan tidak lebih dari waktu yang dialokasikan
        completedTime = Math.min(completedTime, allocatedTime);
        
        // Tambahkan ke statistik harian
        weeklyData.days[day].allocatedTime += allocatedTime;
        weeklyData.days[day].completedTime += completedTime;
        
        // Tambahkan detail tugas
        weeklyData.days[day].tasks.push({
          id: task.id,
          title: task.title,
          allocatedTime,
          completedTime,
          isDone: task.isDone,
          isTimerRunning: task.isTimerRunning
        });
        
        // Tambahkan ke total mingguan
        weeklyData.totalAllocatedTime += allocatedTime;
        weeklyData.totalCompletedTime += completedTime;
      });
    });

    // Sortir tugas berdasarkan waktu yang dialokasikan
    Object.keys(weeklyData.days).forEach(day => {
      weeklyData.days[day].tasks.sort((a, b) => b.allocatedTime - a.allocatedTime);
    });

    return weeklyData;
  }, [tasks, activeTimerId]);


  // Modifikasi untuk TaskContext.jsx
// Tambahkan fungsi-fungsi berikut atau ganti fungsi yang sudah ada di TaskContext.jsx

// Fungsi untuk memastikan timeRemaining dan timeUsed tersimpan dengan benar
// dalam localStorage saat navigasi antar halaman

// Helper untuk mendapatkan waktu berlalu (dalam detik) dari waktu start
const getElapsedTimeInSeconds = (startTime) => {
  if (!startTime) return 0;
  return Math.floor((Date.now() - parseInt(startTime)) / 1000);
};

// Tambahkan properti berikut ke TaskProvider
const [timerLastSyncTime, setTimerLastSyncTime] = useState(Date.now());

// Modifikasi useEffect untuk visibilitychange
useEffect(() => {
  const handleVisibilityChange = () => {
    const savedActiveTimerId = localStorage.getItem('activeTimerId');
    const startTimestamp = localStorage.getItem('timerStartTimestamp');
    
    if (savedActiveTimerId && startTimestamp) {
      if (!document.hidden) { // Tab menjadi visible
        // Hitung waktu yang telah berlalu dan update timer
        const elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
        console.log(`Tab visible again. Elapsed time: ${elapsedSeconds}s`);
        
        // Catat waktu untuk perhitungan berikutnya
        setBackgroundTime(prev => prev + elapsedSeconds);
        
        // Perbarui timestamp mulai
        localStorage.setItem('timerStartTimestamp', Date.now().toString());
        
        // Simpan juga elapsed time saat ini agar dapat digunakan oleh komponan lain
        localStorage.setItem('lastTimerElapsed', elapsedSeconds.toString());
        
        // Temukan dan update task
        let foundTask = null;
        let foundDay = null;
        
        Object.keys(tasks).forEach(day => {
          const activeTask = tasks[day].find(task => task.id === savedActiveTimerId);
          if (activeTask) {
            foundTask = activeTask;
            foundDay = day;
          }
        });
        
        if (foundTask && foundDay) {
          const updatedTimeRemaining = Math.max(0, foundTask.timeRemaining - elapsedSeconds);
          const currentTimeUsed = foundTask.timeUsed || 0;
          const updatedTimeUsed = currentTimeUsed + elapsedSeconds;
          
          // Simpan data waktu ke localStorage untuk ditampilkan oleh komponen lain
          localStorage.setItem('currentTaskTimeRemaining', updatedTimeRemaining.toString());
          localStorage.setItem('currentTaskTimeUsed', updatedTimeUsed.toString());
          
          // Update task
          updateTask(
            savedActiveTimerId, 
            { 
              timeRemaining: updatedTimeRemaining,
              timeUsed: updatedTimeUsed
            }, 
            foundDay
          );
          
          // Jika timer habis, selesaikan task
          if (updatedTimeRemaining <= 0) {
            completeTask(savedActiveTimerId, foundDay);
          }
        }
      } else { // Tab menjadi hidden
        // Catat waktu saat ini untuk perhitungan berikutnya
        localStorage.setItem('timerStartTimestamp', Date.now().toString());
        setTimerLastSyncTime(Date.now());
      }
    }
  };
  
  // Pasang event listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleVisibilityChange);
  
  // Cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleVisibilityChange);
  };
}, [tasks, updateTask, completeTask]);

const startTimer = useCallback((taskId, day, currentTimeRemaining = null) => {
  setTasks(prevTasks => {
    if (!prevTasks[day]) return prevTasks;
    
    const taskIndex = prevTasks[day].findIndex(t => t.id === taskId);
    if (taskIndex === -1) return prevTasks;
    
    // Buat salinan state untuk update yang aman
    const newTasks = {...prevTasks};
    
    // Jika ada timer lain yang berjalan, hentikan dulu
    if (activeTimerId && activeTimerId !== taskId) {
      Object.keys(newTasks).forEach(d => {
        const taskList = newTasks[d];
        newTasks[d] = taskList.map(t => {
          if (t.id === activeTimerId && t.isTimerRunning) {
            // Stop notification untuk timer sebelumnya
            NotificationService.stopTimerNotification(activeTimerId);
            
            // Hitung waktu yang telah digunakan
            const startTimestamp = localStorage.getItem('timerStartTimestamp');
            let elapsedSeconds = 0;
            if (startTimestamp) {
              elapsedSeconds = getElapsedTimeInSeconds(startTimestamp);
            }
            
            // Update timeUsed
            const updatedTimeUsed = (t.timeUsed || 0) + elapsedSeconds;
            
            return { 
              ...t, 
              isTimerRunning: false,
              timeUsed: updatedTimeUsed
            };
          }
          return t;
        });
      });
    }
    
    const newDayTasks = [...newTasks[day]];
    const taskToUpdate = newDayTasks[taskIndex];
    
    // Update task yang diinginkan
    newDayTasks[taskIndex] = {
      ...taskToUpdate,
      isTimerRunning: true,
      startedAt: taskToUpdate.startedAt || new Date().toISOString(),
      timeRemaining: currentTimeRemaining !== null ? currentTimeRemaining : taskToUpdate.timeRemaining
    };
    
    newTasks[day] = newDayTasks;
    
    // Kirim notifikasi timer dimulai
    const timeRemaining = currentTimeRemaining !== null ? currentTimeRemaining : taskToUpdate.timeRemaining;
    NotificationService.timerStarted(taskToUpdate.title, taskToUpdate.duration);
    
    // Start timer notification untuk mobile
    NotificationService.startTimerNotification(taskId, taskToUpdate.title, timeRemaining);
    
    return newTasks;
  });
  
  // Set active timer ID
  setActiveTimerId(taskId);
  
  // Catat waktu mulai untuk perhitungan background
  const now = Date.now();
  localStorage.setItem('activeTimerId', taskId);
  localStorage.setItem('timerStartTimestamp', now.toString());
  localStorage.setItem('timerLastSync', now.toString());
  setTimerLastSyncTime(now);
  
  setTimeout(() => {
    toast.success(`Timer dimulai`);
  }, 0);
}, [activeTimerId]);

const pauseTimer = useCallback((taskId, timeRemaining, day) => {
  if (typeof timeRemaining !== 'number' || isNaN(timeRemaining)) {
    console.error('Invalid timeRemaining value:', timeRemaining);
    timeRemaining = 0;
  }
  
  // Stop timer notification
  NotificationService.stopTimerNotification(taskId);
  
  // Hitung waktu yang telah digunakan dalam sesi ini
  let sessionTimeUsed = 0;
  if (activeTimerId === taskId) {
    const startTimestamp = localStorage.getItem('timerStartTimestamp');
    if (startTimestamp) {
      sessionTimeUsed = getElapsedTimeInSeconds(startTimestamp);
    }
  }
  
  setTasks(prevTasks => {
    if (!prevTasks[day]) return prevTasks;
    
    const taskIndex = prevTasks[day].findIndex(t => t.id === taskId);
    if (taskIndex === -1) return prevTasks;
    
    const task = prevTasks[day][taskIndex];
    const currentTimeUsed = task.timeUsed || 0;
    const updatedTimeUsed = currentTimeUsed + sessionTimeUsed;
    
    // Kirim notifikasi timer dijeda
    NotificationService.timerPaused(task.title, timeRemaining);
    
    // Buat salinan state untuk update yang aman
    const newTasks = {...prevTasks};
    const newDayTasks = [...newTasks[day]];
    
    // Update task dengan timeRemaining yang tepat dan timeUsed
    newDayTasks[taskIndex] = {
      ...newDayTasks[taskIndex],
      isTimerRunning: false,
      timeRemaining,
      timeUsed: updatedTimeUsed
    };
    
    newTasks[day] = newDayTasks;
    return newTasks;
  });
  
  // Reset active timer ID
  if (activeTimerId === taskId) {
    setActiveTimerId(null);
    localStorage.removeItem('activeTimerId');
    localStorage.removeItem('timerStartTimestamp');
    localStorage.removeItem('currentTaskTimeRemaining');
    localStorage.removeItem('currentTaskTimeUsed');
    localStorage.removeItem('timerLastSync');
  }
  
  setTimeout(() => {
    toast.success(`Timer dijeda`);
  }, 0);
}, [activeTimerId]);


// Register plugin
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// Fungsi untuk mendapatkan tanggal awal dan akhir minggu
const getWeekBounds = (date = new Date()) => {
  const d = dayjs(date);
  // Anggap Senin sebagai awal minggu (1)
  const startOfWeek = d.startOf('isoWeek').toDate();
  const endOfWeek = d.endOf('isoWeek').toDate();
  return { startOfWeek, endOfWeek };
};

// Fungsi untuk mendapatkan nomor minggu dan tahun
const getWeekIdentifier = (date = new Date()) => {
  const d = dayjs(date);
  return {
    year: d.year(),
    week: d.isoWeek(),
    label: `Minggu ${d.isoWeek()}, ${d.year()}`
  };
};

// Dalam TaskProvider, tambahkan state berikut:
const [weeklyHistory, setWeeklyHistory] = useState(() => {
  try {
    const savedHistory = localStorage.getItem('weeklyHistory');
    return savedHistory ? JSON.parse(savedHistory) : {};
  } catch (error) {
    console.error("Error loading weekly history from localStorage:", error);
    return {};
  }
});

// State untuk mengidentifikasi minggu saat ini
const [currentWeekId, setCurrentWeekId] = useState(() => {
  const { year, week } = getWeekIdentifier();
  return `${year}-${week}`;
});

// Efek untuk memeriksa pergantian minggu dan mereset data jika perlu
useEffect(() => {
  // Jalankan pemeriksaan setiap kali komponen dimount
  const checkWeekReset = () => {
    const { year, week } = getWeekIdentifier();
    const newWeekId = `${year}-${week}`;
    
    if (newWeekId !== currentWeekId) {
      console.log('Minggu baru terdeteksi:', newWeekId);
      
      // Catat data minggu sebelumnya ke history
      saveWeekToHistory(currentWeekId);
      
      // Update currentWeekId
      setCurrentWeekId(newWeekId);
    }
  };
  
  // Panggil fungsi pemeriksaan
  checkWeekReset();
  
  // Jalankan pemeriksaan setiap hari pada tengah malam
  const setMidnightCheck = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1);
    
    const timeToMidnight = midnight - now;
    
    // Set timeout untuk memeriksa pada tengah malam
    const midnightTimeout = setTimeout(() => {
      checkWeekReset();
      // Setelah dijalankan, set untuk malam berikutnya
      setMidnightCheck();
    }, timeToMidnight);
    
    return midnightTimeout;
  };
  
  const midnightTimeout = setMidnightCheck();
  
  return () => {
    clearTimeout(midnightTimeout);
  };
}, [currentWeekId]);

// Efek untuk menyimpan weeklyHistory ke localStorage
useEffect(() => {
  try {
    localStorage.setItem('weeklyHistory', JSON.stringify(weeklyHistory));
  } catch (error) {
    console.error("Error saving weekly history to localStorage:", error);
  }
}, [weeklyHistory]);

// Fungsi untuk menyimpan data minggu saat ini ke history
const saveWeekToHistory = useCallback((weekId = currentWeekId) => {
  if (!weekId) return;
  
  // Buat ringkasan data minggu
  const weeklyStats = getWeeklyStats();
  
  // Dapatkan informasi tahun dan minggu dari weekId
  const [year, week] = weekId.split('-').map(Number);
  
  // Buat data yang akan disimpan
  const weekData = {
    weekId,
    year,
    week,
    label: `Minggu ${week}, ${year}`,
    timestamp: Date.now(),
    stats: {
      totalAllocatedTime: weeklyStats.totalAllocatedTime,
      totalCompletedTime: weeklyStats.totalCompletedTime,
      completionRate: weeklyStats.totalAllocatedTime > 0 
        ? (weeklyStats.totalCompletedTime / weeklyStats.totalAllocatedTime) * 100 
        : 0,
      days: weeklyStats.days
    }
  };
  
  // Simpan ke history
  setWeeklyHistory(prev => ({
    ...prev,
    [weekId]: weekData
  }));
  
  return weekData;
}, [getWeeklyStats, currentWeekId]);

// Fungsi untuk mendapatkan data history mingguan (dengan pagination)
const getWeeklyHistory = useCallback((page = 1, limit = 5) => {
  // Konversi objek history menjadi array dan urutkan berdasarkan timestamp (terbaru dulu)
  const historyArray = Object.values(weeklyHistory)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // Hitung total halaman
  const totalItems = historyArray.length;
  const totalPages = Math.ceil(totalItems / limit);
  
  // Validasi halaman
  const validPage = Math.max(1, Math.min(page, totalPages));
  
  // Ambil data untuk halaman yang diminta
  const startIdx = (validPage - 1) * limit;
  const endIdx = startIdx + limit;
  const pageItems = historyArray.slice(startIdx, endIdx);
  
  return {
    items: pageItems,
    pagination: {
      page: validPage,
      limit,
      totalItems,
      totalPages
    }
  };
}, [weeklyHistory]);

// Fungsi untuk mendapatkan data minggu saat ini
const getCurrentWeekData = useCallback(() => {
  // Coba ambil dari history dulu
  if (weeklyHistory[currentWeekId]) {
    return weeklyHistory[currentWeekId];
  }
  
  // Jika tidak ada di history, buat data baru
  const weeklyStats = getWeeklyStats();
  const [year, week] = currentWeekId.split('-').map(Number);
  
  return {
    weekId: currentWeekId,
    year,
    week,
    label: `Minggu ${week}, ${year}`,
    timestamp: Date.now(),
    stats: {
      totalAllocatedTime: weeklyStats.totalAllocatedTime,
      totalCompletedTime: weeklyStats.totalCompletedTime,
      completionRate: weeklyStats.totalAllocatedTime > 0 
        ? (weeklyStats.totalCompletedTime / weeklyStats.totalAllocatedTime) * 100 
        : 0,
      days: weeklyStats.days
    }
  };
}, [currentWeekId, weeklyHistory, getWeeklyStats]);

// Fungsi untuk memaksa refresh history
const refreshWeeklyHistory = useCallback(() => {
  // Simpan data minggu saat ini
  const currentData = saveWeekToHistory();
  
  // Return data yang baru saja disimpan
  return currentData;
}, [saveWeekToHistory]);




  // Provide context value
  const contextValue = {
    tasks,
    today,
    currentDate,
    darkMode,
    activeTimerId,
    backgroundTime,
    currentWeekId,
    getWeeklyHistory,
    getCurrentWeekData,
    refreshWeeklyHistory,
    setBackgroundTime,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    startTimer,
    pauseTimer,
    getTodayTasks,
    toggleDarkMode,
    resetAllData,
    exportData,
    getStatistics,
    getWeeklyStats
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};
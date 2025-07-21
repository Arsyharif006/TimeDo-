// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import TaskTimer from '../components/TaskTimer';
import AnimationWrapper from '../components/AnimationWrapper';
import { FaCheck, FaClock, FaStar, FaCalendarAlt } from 'react-icons/fa';
import dayjs from 'dayjs';

const HomePage = () => {
  const { tasks, getTodayTasks, today, getStatistics } = useTaskContext();
  const todayTasks = getTodayTasks();
  const stats = getStatistics().byDay[today] || { total: 0, completed: 0 };
  const allStats = getStatistics();
  
  // State untuk jam dan tanggal
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State untuk quote motivasi
  const [motivationalQuote, setMotivationalQuote] = useState('');
  
  // State untuk streak
  const [streak, setStreak] = useState(0);
  
  // Update jam setiap menit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Cleanup
    return () => clearInterval(timer);
  }, []);
  
  // Pilih quote motivasi secara random
  useEffect(() => {
    const quotes = [
      "Setiap tugas yang selesai adalah langkah menuju kesuksesan.",
      "Produktivitas bukan tentang melakukan banyak hal, tapi tentang melakukan hal yang tepat.",
      "Perjalanan ribuan kilometer dimulai dari langkah pertama.",
      "Fokus pada progres, bukan kesempurnaan.",
      "Disiplin adalah jembatan antara tujuan dan pencapaian.",
      "Jangan menunda sampai besok apa yang bisa kamu kerjakan hari ini.",
      "Waktu adalah aset paling berharga. Manfaatkan dengan bijak.",
      "Kebiasaan kecil yang konsisten membawa perubahan besar.",
      "Tindakan hari ini menentukan hasil di masa depan."
    ];
    
    // Pilih quote acak
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setMotivationalQuote(quotes[randomIndex]);
  }, []);
  
  // Hitung streak (berapa hari berturut-turut ada tugas yang diselesaikan)
  useEffect(() => {
    const calculateStreak = () => {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const todayIndex = days.indexOf(today);
      let currentStreak = 0;
      
      // Cek hari ini
      const hasCompletedToday = tasks[today]?.some(task => task.isDone) || false;
      if (hasCompletedToday) currentStreak = 1;
      
      // Cek hari-hari sebelumnya
      for (let i = 1; i <= 6; i++) {
        const previousDayIndex = (todayIndex - i + 7) % 7;
        const previousDay = days[previousDayIndex];
        const hasCompletedTask = tasks[previousDay]?.some(task => task.isDone) || false;
        
        if (hasCompletedTask) currentStreak++;
        else break;
      }
      
      setStreak(currentStreak);
    };
    
    calculateStreak();
  }, [tasks, today]);

  // Data statistik untuk ditampilkan
  const completedToday = stats.completed;
  const totalToday = stats.total;
  const completionRate = allStats.global.completionRate.toFixed(0);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      {/* Header dengan waktu dan tanggal */}
      <AnimationWrapper animation="fade-down">
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {dayjs().format('dddd, D MMMM YYYY')}
          </p>
        </div>
      </AnimationWrapper>
      
      {/* Card utama dengan statistik */}
      <AnimationWrapper animation="fade-up" delay={100}>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">
              To-do {today}
            </h1>
            <div className="flex items-center">
              <FaStar className="text-yellow-300 mr-1" />
              <span className="font-medium">{streak} hari streak</span>
            </div>
          </div>
          <p className="text-blue-100 text-sm italic mb-3">"{motivationalQuote}"</p>
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <div className="text-xl font-bold">{completedToday}/{totalToday}</div>
              <div className="text-xs">Selesai</div>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <div className="text-xl font-bold">{allStats.global.total}</div>
              <div className="text-xs">Total Tugas</div>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <div className="text-xl font-bold">{completionRate}%</div>
              <div className="text-xs">Performa</div>
            </div>
          </div>
        </div>
      </AnimationWrapper>
      
      {/* Daftar tugas hari ini */}
      <AnimationWrapper animation="fade-up" delay={200}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaClock className="mr-2 text-blue-500" />
          Tugas Hari Ini
        </h2>
      </AnimationWrapper>
      
      <div className="space-y-4 mb-8">
        {todayTasks.length > 0 ? (
          todayTasks.map((task, index) => (
            <AnimationWrapper key={task.id} animation="fade-up" delay={300 + index * 100}>
              <TaskTimer task={task} />
            </AnimationWrapper>
          ))
        ) : (
          <AnimationWrapper animation="fade-in" delay={300}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <FaClock className="text-gray-400 text-4xl mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Tidak ada tugas untuk hari ini.
                <br />
                Tambahkan tugas di tab Manajemen.
              </p>
            </div>
          </AnimationWrapper>
        )}
      </div>
      
      {/* Tugas mendatang (dari hari lain) */}
      {todayTasks.length > 0 && (
        <AnimationWrapper animation="fade-up" delay={500}>
          <div className="mt-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-purple-500" />
              Tugas Mendatang
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              {Object.keys(tasks).some(day => 
                day !== today && 
                tasks[day].filter(task => !task.isDone).length > 0
              ) ? (
                Object.keys(tasks).map(day => {
                  if (day === today) return null;
                  
                  const upcomingTasks = tasks[day].filter(task => !task.isDone);
                  if (upcomingTasks.length === 0) return null;
                  
                  return (
                    <div key={day} className="mb-4 last:mb-0">
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {day}
                      </h3>
                      <div className="space-y-2">
                        {upcomingTasks.slice(0, 2).map(task => (
                          <div 
                            key={task.id}
                            className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {task.title}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                              {task.duration} min
                            </span>
                          </div>
                        ))}
                        
                        {upcomingTasks.length > 2 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                            +{upcomingTasks.length - 2} tugas lainnya
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-3">
                  Tidak ada tugas mendatang yang dijadwalkan
                </p>
              )}
            </div>
          </div>
        </AnimationWrapper>
      )}
    </div>
  );
};

export default HomePage;
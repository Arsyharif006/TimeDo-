// src/pages/StatisticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { Bar, Pie } from 'react-chartjs-2';
import AnimationWrapper from '../components/AnimationWrapper';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { 
  FaClock, 
  FaCalendarAlt, 
  FaChartBar, 
  FaInfoCircle, 
  FaHistory, 
  FaChevronLeft, 
  FaChevronRight,
  FaRegClock
} from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatisticsPage = () => {
  // Context dan state
  const { 
    getStatistics, 
    getWeeklyStats, 
    today,
    currentWeekId,
    getWeeklyHistory,
    getCurrentWeekData,
    refreshWeeklyHistory
  } = useTaskContext();
  
  // State umum
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'weekly', atau 'history'
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  
  // State untuk statistik
  const [statistics, setStatistics] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [currentWeekInfo, setCurrentWeekInfo] = useState(null);
  
  // State untuk riwayat mingguan
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [weeklyHistoryData, setWeeklyHistoryData] = useState(null);
  const [weeklyHistoryPages, setWeeklyHistoryPages] = useState({ page: 1, totalPages: 1 });
  const [selectedWeekData, setSelectedWeekData] = useState(null);

  // Format menit menjadi jam dan menit
  const formatMinutes = useCallback((minutes) => {
    if (!minutes || isNaN(minutes)) return '0 menit';
    
    if (minutes < 60) {
      return `${minutes} menit`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} jam`;
    }
    return `${hours} jam ${remainingMinutes} menit`;
  }, []);

  // Fungsi untuk mendapatkan persentase dari alokasi waktu
  const getCompletionPercentage = useCallback((completed, allocated) => {
    if (!allocated || allocated === 0) return 0;
    return Math.round((completed / allocated) * 100);
  }, []);

  // Update statistik saat component mount dan saat data berubah
  useEffect(() => {
    // Gunakan setTimeout untuk menghindari blocking rendering
    const timer = setTimeout(() => {
      try {
        // Dapatkan data statistik umum dan mingguan
        const generalStats = getStatistics();
        const weeklyData = getWeeklyStats();
        
        // Dapatkan informasi minggu saat ini
        const currentWeek = getCurrentWeekData();
        
        setStatistics(generalStats);
        setWeeklyStats(weeklyData);
        
        // Set informasi minggu saat ini
        setCurrentWeekInfo(currentWeek);
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setLoading(false);
      }
    }, 0);
    
    // Update statistik setiap 30 detik jika ada timer yang sedang berjalan
    const intervalId = setInterval(() => {
      const activeTimer = localStorage.getItem('activeTimerId');
      if (activeTimer) {
        const generalStats = getStatistics();
        const weeklyData = getWeeklyStats();
        
        setStatistics(generalStats);
        setWeeklyStats(weeklyData);
      }
    }, 30000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [getStatistics, getWeeklyStats, getCurrentWeekData]);

  // Efek untuk memuat riwayat mingguan - DIPERBAIKI
  useEffect(() => {
    if (activeTab === 'history') {
      try {
        const historyData = getWeeklyHistory(historyPage, 5);
        setWeeklyHistoryData(historyData.items);
        setWeeklyHistoryPages(historyData.pagination);
        
        // Jika ada weekId yang dipilih, cari di data baru
        if (selectedWeekId) {
          const selected = historyData.items.find(item => item.weekId === selectedWeekId);
          if (selected) {
            setSelectedWeekData(selected);
          } else {
            // Jika tidak ditemukan, reset selection
            setSelectedWeekId(null);
            setSelectedWeekData(null);
            // Pilih item pertama jika ada
            if (historyData.items.length > 0) {
              setSelectedWeekId(historyData.items[0].weekId);
              setSelectedWeekData(historyData.items[0]);
            }
          }
        } else if (historyData.items.length > 0) {
          // Jika tidak ada yang dipilih dan ada data, pilih yang pertama
          setSelectedWeekId(historyData.items[0].weekId);
          setSelectedWeekData(historyData.items[0]);
        }
      } catch (error) {
        console.error("Error loading history data:", error);
      }
    }
  }, [activeTab, historyPage, getWeeklyHistory]); // Hapus selectedWeekId dari dependencies

  // Efek terpisah untuk refresh data saat tab history aktif
  useEffect(() => {
    if (activeTab === 'history') {
      try {
        refreshWeeklyHistory();
      } catch (error) {
        console.error("Error refreshing history data:", error);
      }
    }
  }, [activeTab, refreshWeeklyHistory]);

  // Handler untuk mengubah halaman
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= weeklyHistoryPages.totalPages) {
      setHistoryPage(newPage);
      setSelectedWeekId(null);
      setSelectedWeekData(null);
    }
  }, [weeklyHistoryPages.totalPages]);

  // Handler untuk memilih minggu
  const handleSelectWeek = useCallback((weekId, weekData) => {
    setSelectedWeekId(weekId);
    setSelectedWeekData(weekData);
  }, []);

  // Warna untuk chart
  const chartColors = {
    completed: {
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderColor: 'rgb(16, 185, 129)'
    },
    incomplete: {
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgb(239, 68, 68)'
    },
    allocated: {
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgb(59, 130, 246)'
    }
  };

  // Data untuk bar chart (tugas per hari)
  const barChartData = statistics ? {
    labels: Object.keys(statistics.byDay),
    datasets: [
      {
        label: 'Selesai',
        data: Object.values(statistics.byDay).map(day => day.completed),
        backgroundColor: chartColors.completed.backgroundColor,
        borderColor: chartColors.completed.borderColor,
        borderWidth: 1
      },
      {
        label: 'Belum Selesai',
        data: Object.values(statistics.byDay).map(day => day.incomplete),
        backgroundColor: chartColors.incomplete.backgroundColor,
        borderColor: chartColors.incomplete.borderColor,
        borderWidth: 1
      }
    ]
  } : null;

  // Options untuk bar chart
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
        }
      },
      title: {
        display: true,
        text: 'Tugas Per Hari',
        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
      }
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        stacked: false,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Data untuk pie chart
  const pieChartData = statistics ? {
    labels: ['Selesai', 'Belum Selesai'],
    datasets: [
      {
        data: [statistics.global.completed, statistics.global.incomplete],
        backgroundColor: [
          chartColors.completed.backgroundColor,
          chartColors.incomplete.backgroundColor
        ],
        borderColor: [
          chartColors.completed.borderColor,
          chartColors.incomplete.borderColor
        ],
        borderWidth: 1
      }
    ]
  } : null;

  // Options untuk pie chart
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
        }
      },
      title: {
        display: true,
        text: 'Status Tugas Keseluruhan',
        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
      }
    }
  };

  // Data untuk chart waktu mingguan
  const weeklyTimeChartData = weeklyStats ? {
    labels: Object.keys(weeklyStats.days),
    datasets: [
      {
        label: 'Waktu Dialokasikan (menit)',
        data: Object.values(weeklyStats.days).map(day => day.allocatedTime),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Waktu Terpakai (menit)',
        data: Object.values(weeklyStats.days).map(day => day.completedTime),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  } : null;

  // Options untuk chart waktu mingguan
  const weeklyTimeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
        }
      },
      title: {
        display: true,
        text: 'Alokasi vs Penggunaan Waktu (menit)',
        color: document.documentElement.classList.contains('dark') ? 'white' : 'black'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const datasetLabel = context.dataset.label;
            return `${datasetLabel}: ${value} menit`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Tampilkan loading
  if (loading) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <AnimationWrapper animation="fade-down">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Statistik
        </h1>
      </AnimationWrapper>
      
      {/* Tab selector */}
      <AnimationWrapper animation="fade-up" delay={100}>
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              <FaChartBar className="inline mr-1" /> Umum
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('weekly')}
            >
              <FaCalendarAlt className="inline mr-1" /> Mingguan
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <FaHistory className="inline mr-1" /> Riwayat
            </button>
          </div>
        </div>
      </AnimationWrapper>
      
      {/* General Statistics Tab */}
      {activeTab === 'general' && statistics && (
        <>
          {/* Informasi minggu saat ini */}
          <AnimationWrapper animation="fade-up" delay={50}>
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-blue-800 dark:text-blue-200">
                  {currentWeekInfo ? currentWeekInfo.label : 'Minggu Ini'}
                </h2>
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  Hanya menampilkan data minggu ini
                </div>
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Toggle jenis chart */}
          <AnimationWrapper animation="fade-up" delay={100}>
            <div className="flex justify-center mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setChartType('bar')}
                >
                  Distribusi Data
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'pie'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setChartType('pie')}
                >
                 Komposisi Data
                </button>
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Chart container */}
          <AnimationWrapper animation="fade-up" delay={200}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="h-64">
                {chartType === 'bar' ? (
                  <Bar data={barChartData} options={barChartOptions} />
                ) : (
                  <Pie data={pieChartData} options={pieChartOptions} />
                )}
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Summary statistics */}
          <AnimationWrapper animation="fade-up" delay={300}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-3">
                Ringkasan
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tugas</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{statistics.global.total}</p>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">Selesai</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">{statistics.global.completed}</p>
                </div>
                
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">Belum Selesai</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{statistics.global.incomplete}</p>
                </div>
                
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Tingkat Penyelesaian</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {statistics.global.completionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Performa per Hari
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(statistics.byDay).map(([day, data]) => (
                    <div key={day} className="flex items-center">
                      <div className="w-24 text-sm text-gray-700 dark:text-gray-300">{day}</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${data.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-14 text-right text-sm text-gray-700 dark:text-gray-300">
                        {data.completed}/{data.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimationWrapper>
        </>
      )}
      
      {/* Weekly Statistics Tab */}
      {activeTab === 'weekly' && weeklyStats && (
        <>
          {/* Informasi minggu saat ini */}
          <AnimationWrapper animation="fade-up" delay={50}>
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-blue-800 dark:text-blue-200">
                  {currentWeekInfo ? currentWeekInfo.label : 'Minggu Ini'}
                </h2>
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  Hanya menampilkan data minggu ini
                </div>
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Weekly chart */}
          <AnimationWrapper animation="fade-up" delay={200}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-800 dark:text-white flex items-center">
                  <FaClock className="mr-1 text-blue-500" /> Waktu Tugas Mingguan
                </h2>
              </div>
              
              <div className="flex items-center mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                <FaInfoCircle className="mr-2 flex-shrink-0" />
                <p>Grafik menunjukkan waktu yang dialokasikan (biru) vs waktu yang benar-benar digunakan (hijau)</p>
              </div>
              
              <div className="h-64">
                <Bar data={weeklyTimeChartData} options={weeklyTimeChartOptions} />
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Weekly summary */}
          <AnimationWrapper animation="fade-up" delay={300}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-3">
                Ringkasan Mingguan
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Total Waktu Dialokasikan</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {formatMinutes(weeklyStats.totalAllocatedTime)}
                  </p>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">Total Waktu Terpakai</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatMinutes(weeklyStats.totalCompletedTime)}
                  </p>
                </div>
                
                <div className="col-span-2 bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">Persentase Penggunaan Waktu</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {getCompletionPercentage(weeklyStats.totalCompletedTime, weeklyStats.totalAllocatedTime)}%
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                      dari total {formatMinutes(weeklyStats.totalAllocatedTime)}
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" />
                Detail Waktu per Hari
              </h3>
              
              <div className="space-y-6">
                {Object.entries(weeklyStats.days).map(([day, data]) => (
                  <div key={day} className={`${day === today ? 'border-l-4 border-blue-500 pl-2' : ''}`}>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        {day} {day === today && <span className="text-xs text-blue-500 ml-1">(Hari ini)</span>}
                      </h4>
                      <div className="text-sm flex items-center">
                        <span className="text-green-600 dark:text-green-400">{data.completedTime}</span>
                        <span className="text-gray-500 dark:text-gray-400 mx-1">/</span>
                        <span className="text-blue-600 dark:text-blue-400">{data.allocatedTime}</span>
                        <span className="text-gray-500 dark:text-gray-400"> menit</span>
                      </div>
                    </div>
                    
                    {/* Progress bar dengan 2 indikator */}
                    <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                      {/* Waktu yang digunakan */}
                      <div 
                        className="absolute left-0 h-3 bg-green-500 dark:bg-green-600 rounded-full"
                        style={{ width: `${getCompletionPercentage(data.completedTime, data.allocatedTime)}%` }}
                      ></div>
                      
                      {/* Label persentase */}
                      {data.completedTime > 0 && data.allocatedTime > 0 && (
                        <div 
                          className="absolute text-xs text-white font-medium flex items-center justify-center"
                          style={{ 
                            left: `${Math.min(Math.max(getCompletionPercentage(data.completedTime, data.allocatedTime)/2, 5), 95)}%`,
                            top: '0',
                            height: '100%'
                          }}
                        >
                          {getCompletionPercentage(data.completedTime, data.allocatedTime)}%
                        </div>
                      )}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <div>
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Waktu terpakai
                      </div>
                      <div>
                        Dialokasikan: {formatMinutes(data.allocatedTime)}
                      </div>
                    </div>
                    
                    {/* Daftar tugas */}
                    {data.tasks.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {data.tasks.slice(0, 3).map((task, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  task.isDone 
                                    ? 'bg-green-500' 
                                    : task.isTimerRunning 
                                      ? 'bg-blue-500 animate-pulse' 
                                      : 'bg-yellow-500'
                                }`}></div>
                                <div className="font-medium text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {task.title}
                                </div>
                              </div>
                              <div className={`text-xs px-2 py-0.5 rounded-full ${
                                task.isDone 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : task.isTimerRunning 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse' 
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {task.isDone ? 'Selesai' : task.isTimerRunning ? 'Berjalan' : 'Belum Selesai'}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <div className="text-gray-500 dark:text-gray-400">
                                Alokasi: {task.allocatedTime} menit
                              </div>
                              
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Terpakai: </span>
                                <span className={
                                  task.completedTime > 0 
                                    ? 'text-green-600 dark:text-green-400 font-medium' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }>
                                  {task.completedTime} menit
                                </span>
                                <span className="text-gray-500 dark:text-gray-400"> ({getCompletionPercentage(task.completedTime, task.allocatedTime)}%)</span>
                              </div>
                            </div>
                            
                            {/* Progress bar tugas */}
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                              <div
                                className="bg-green-500 h-1 rounded-full"
                                style={{ width: `${getCompletionPercentage(task.completedTime, task.allocatedTime)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        
                        {data.tasks.length > 3 && (
                          <button className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:underline py-1">
                            +{data.tasks.length - 3} tugas lainnya
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        Tidak ada tugas untuk hari {day}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Tugas dengan Waktu Terlama */}
          <AnimationWrapper animation="fade-up" delay={400}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <FaClock className="mr-2 text-orange-500" />
                Tugas dengan Waktu Terlama
              </h2>
              
              <div className="flex items-center mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                <FaInfoCircle className="mr-2 flex-shrink-0" />
                <p>Data menampilkan waktu yang benar-benar digunakan, bukan total durasi tugas</p>
              </div>
              
              <div className="space-y-3">
                {Object.values(weeklyStats.days)
                  .flatMap(day => day.tasks)
                  .sort((a, b) => b.allocatedTime - a.allocatedTime)
                  .slice(0, 5)
                  .map((task, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-800 dark:text-white truncate mr-2">
                          {task.title}
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          task.isDone 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : task.isTimerRunning
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {task.isDone ? 'Selesai' : task.isTimerRunning ? 'Berjalan' : 'Belum Selesai'}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progres: {getCompletionPercentage(task.completedTime, task.allocatedTime)}%</span>
                          <span>{task.completedTime}/{task.allocatedTime} menit</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              task.isDone ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${getCompletionPercentage(task.completedTime, task.allocatedTime)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {Object.values(weeklyStats.days)
                  .flatMap(day => day.tasks).length === 0 && (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <FaRegClock className="mx-auto mb-2" size={24} />
                    <p>Belum ada tugas yang ditambahkan minggu ini</p>
                  </div>
                )}
              </div>
            </div>
          </AnimationWrapper>
        </>
      )}
      
      {/* Weekly History Tab */}
      {activeTab === 'history' && (
        <>
          <AnimationWrapper animation="fade-up" delay={200}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  Riwayat Mingguan
                </h2>
                
                {/* Pagination */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(weeklyHistoryPages.page - 1)}
                    disabled={weeklyHistoryPages.page <= 1}
                    className={`p-1 rounded ${
                      weeklyHistoryPages.page <= 1 
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
                    }`}
                  >
                    <FaChevronLeft size={16} />
                  </button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {weeklyHistoryPages.page} / {weeklyHistoryPages.totalPages || 1}
                  </span>
                  
                  <button 
                    onClick={() => handlePageChange(weeklyHistoryPages.page + 1)}
                    disabled={weeklyHistoryPages.page >= weeklyHistoryPages.totalPages}
                    className={`p-1 rounded ${
                      weeklyHistoryPages.page >= weeklyHistoryPages.totalPages 
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
                    }`}
                  >
                    <FaChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* Daftar minggu */}
                <div className="md:w-1/3 space-y-2">
                  {weeklyHistoryData && weeklyHistoryData.length > 0 ? (
                    weeklyHistoryData.map((week) => (
                      <div 
                        key={week.weekId} 
                        onClick={() => handleSelectWeek(week.weekId, week)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedWeekId === week.weekId
                            ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium text-gray-800 dark:text-white">
                          {week.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <div className="flex justify-between">
                            <span>
                              <FaClock className="inline mr-1" /> 
                              {formatMinutes(week.stats.totalCompletedTime)}
                            </span>
                            <span>
                              {week.stats.completionRate.toFixed(0)}% selesai
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                      Belum ada data riwayat mingguan
                    </div>
                  )}
                </div>
                
                {/* Detail minggu yang dipilih */}
                <div className="md:w-2/3">
                  {selectedWeekData ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                          {selectedWeekData.label}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <div className="text-xs text-blue-600 dark:text-blue-300">Alokasi Total</div>
                            <div className="font-medium text-blue-800 dark:text-blue-100">
                              {formatMinutes(selectedWeekData.stats.totalAllocatedTime)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-green-600 dark:text-green-300">Waktu Terpakai</div>
                            <div className="font-medium text-green-800 dark:text-green-100">
                              {formatMinutes(selectedWeekData.stats.totalCompletedTime)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                            <span>Efisiensi Waktu</span>
                            <span>{selectedWeekData.stats.completionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${selectedWeekData.stats.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chart untuk minggu yang dipilih */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Distribusi Waktu Per Hari
                        </h4>
                        <div className="h-48">
                          {/* Gunakan data minggu yang dipilih untuk chart */}
                          <Bar 
                            data={{
                              labels: Object.keys(selectedWeekData.stats.days),
                              datasets: [
                                {
                                  label: 'Waktu Dialokasikan (menit)',
                                  data: Object.values(selectedWeekData.stats.days).map(day => day.allocatedTime),
                                  backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                  borderColor: 'rgb(59, 130, 246)',
                                  borderWidth: 1
                                },
                                {
                                  label: 'Waktu Terpakai (menit)',
                                  data: Object.values(selectedWeekData.stats.days).map(day => day.completedTime),
                                  backgroundColor: 'rgba(16, 185, 129, 0.6)',
                                  borderColor: 'rgb(16, 185, 129)',
                                  borderWidth: 1
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Daftar per hari */}
                      <div className="space-y-2">
                        {Object.entries(selectedWeekData.stats.days)
                          .filter(([_, day]) => day.allocatedTime > 0)
                          .map(([dayName, day]) => (
                            <div key={dayName} className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {dayName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {day.completedTime}/{day.allocatedTime} menit
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full"
                                  style={{ 
                                    width: `${day.allocatedTime > 0 ? (day.completedTime / day.allocatedTime) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                        <FaCalendarAlt className="mx-auto mb-2" size={24} />
                        <p>Pilih minggu dari daftar untuk melihat detail</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AnimationWrapper>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
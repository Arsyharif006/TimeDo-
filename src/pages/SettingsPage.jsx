// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { 
  FaMoon, 
  FaSun, 
  FaDownload, 
  FaTrash, 
  FaBell, 
  FaUser, 
  FaInfoCircle,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaCode,
  FaHeart,
  FaCoffee,
  FaPalette,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaMobileAlt,
  FaInstagram,
  FaTwitter
} from 'react-icons/fa';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { SiReact, SiTailwindcss, SiVite, SiJavascript } from 'react-icons/si';
import AnimationWrapper from '../components/AnimationWrapper';
import NotificationService from '../utils/NotificationService';
import toast from 'react-hot-toast';

const SettingsPage = ({ username, setUsername }) => {
  const { darkMode, toggleDarkMode, resetAllData, exportData } = useTaskContext();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditUsernameModalOpen, setIsEditUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);
  
  // Cek apakah notifikasi didukung
  const notificationsSupported = NotificationService.isSupported;
  
  // Cek status izin notifikasi saat mount
  useEffect(() => {
    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, [notificationsSupported]);

  // Handler untuk meminta izin notifikasi
  const handleRequestNotificationPermission = async () => {
    try {
      const permission = await NotificationService.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Izin notifikasi diberikan');
        // Test notification
        NotificationService.testNotification();
      } else if (permission === 'denied') {
        toast.error('Izin notifikasi ditolak. Silakan aktifkan dari pengaturan browser.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Gagal meminta izin notifikasi');
    }
  };

  // Handler untuk membuka modal konfirmasi reset
  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  // Handler untuk menutup modal konfirmasi reset
  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
  };

  // Handler untuk melakukan reset data
  const handleResetData = () => {
    resetAllData();
    setIsResetModalOpen(false);
  };

  // Handler untuk mengekspor data
  const handleExportData = () => {
    exportData();
  };
  
  // Handler untuk membuka modal edit username
  const handleOpenEditUsernameModal = () => {
    setNewUsername(username);
    setIsEditUsernameModalOpen(true);
  };
  
  // Handler untuk menutup modal edit username
  const handleCloseEditUsernameModal = () => {
    setIsEditUsernameModalOpen(false);
  };
  
  // Handler untuk mengubah username
  const handleChangeUsername = () => {
    if (!newUsername.trim()) {
      toast.error('Nama pengguna tidak boleh kosong');
      return;
    }
    
    if (newUsername.trim().length < 3) {
      toast.error('Nama pengguna minimal 3 karakter');
      return;
    }
    
    setUsername(newUsername.trim());
    localStorage.setItem('username', newUsername.trim());
    toast.success('Nama pengguna berhasil diubah');
    setIsEditUsernameModalOpen(false);
  };

  // Get notification status icon
  const getNotificationIcon = () => {
    if (notificationPermission === 'granted') {
      return <FaCheckCircle className="text-green-500" size={16} />;
    } else if (notificationPermission === 'denied') {
      return <FaTimesCircle className="text-red-500" size={16} />;
    }
    return <FaExclamationCircle className="text-yellow-500" size={16} />;
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      {/* Header */}
      <AnimationWrapper animation="fade-down">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Pengaturan
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Kelola preferensi dan data aplikasi Anda
        </p>
      </AnimationWrapper>
      
      <div className="space-y-4">
        {/* User Profile Card */}
        <AnimationWrapper animation="fade-up" delay={50}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur rounded-full flex items-center justify-center">
                  <FaUser size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Selamat datang,</p>
                  <h2 className="text-xl font-bold">
                    {username || 'Pengguna'}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleOpenEditUsernameModal}
                className="p-3 bg-white bg-opacity-20 backdrop-blur rounded-full hover:bg-opacity-30 transition-all"
                aria-label="Edit nama pengguna"
              >
                <FaPalette size={18} />
              </button>
            </div>
          </div>
        </AnimationWrapper>
        
        {/* Settings Cards */}
        <div className="grid gap-4">
          {/* Theme Toggle */}
          <AnimationWrapper animation="fade-up" delay={100}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    darkMode 
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' 
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'
                  }`}>
                    {darkMode ? <FaMoon size={20} /> : <FaSun size={20} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Tema Aplikasi
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {darkMode ? 'Mode gelap' : 'Mode terang'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    darkMode ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Notifications */}
          {notificationsSupported && (
            <AnimationWrapper animation="fade-up" delay={150}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 relative">
                      <FaBell size={20} />
                      <div className="absolute -top-1 -right-1">
                        {getNotificationIcon()}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        Notifikasi Push
                        <FaMobileAlt className="text-gray-500" size={14} />
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notificationPermission === 'granted' 
                          ? 'Aktif untuk desktop & mobile' 
                          : notificationPermission === 'denied'
                            ? 'Diblokir oleh browser'
                            : 'Klik untuk mengaktifkan'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestNotificationPermission}
                    disabled={notificationPermission === 'denied'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      notificationPermission === 'granted'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : notificationPermission === 'denied'
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                    }`}
                  >
                    {notificationPermission === 'granted' ? 'Aktif' : 'Aktifkan'}
                  </button>
                </div>
                {notificationPermission === 'granted' && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <FaInfoCircle className="inline mr-1" />
                    Timer akan muncul di notifikasi dengan update waktu real-time
                  </div>
                )}
              </div>
            </AnimationWrapper>
          )}
          
          {/* Data Management */}
          <AnimationWrapper animation="fade-up" delay={200}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <FaCode className="text-gray-500" />
                  Manajemen Data
                </h3>
              </div>
              
              {/* Export Data */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <button
                  onClick={handleExportData}
                  className="w-full flex justify-between items-center"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                      <FaDownload size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Ekspor Data
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Simpan data sebagai file JSON
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
              
              {/* Reset Data */}
              <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <button
                  onClick={handleOpenResetModal}
                  className="w-full flex justify-between items-center"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
                      <FaTrash size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Reset Data
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Hapus semua data tugas
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>
          </AnimationWrapper>
          
          {/* Developer Info */}
          <AnimationWrapper animation="fade-up" delay={250}>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setShowDeveloperInfo(!showDeveloperInfo)}
                className="w-full p-5 text-left"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      <FaHeart size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        Tentang Pengembang
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dibuat Oleh Muhammad Arya Ramadhan
                      </p>
                    </div>
                  </div>
                  <span className={`text-gray-400 transition-transform ${
                    showDeveloperInfo ? 'rotate-90' : ''
                  }`}>→</span>
                </div>
              </button>
              
              {showDeveloperInfo && (
                <div className="px-5 pb-5 space-y-4 animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        AR
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                        Arsyharif006
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Full Stack Developer
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Passionate membuat aplikasi yang membantu meningkatkan produktivitas. 
                      To-Do List Harian ini dibuat untuk membantu mengelola waktu dengan lebih baik.
                    </p>
                    
                    <div className="flex space-x-3">
                      <a 
                        href="https://github.com/Arsyharif006" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <FaGithub size={18} />
                      </a>
                    
                      <a 
                        href="https://instagram.com/yaseo.n" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <FaInstagram size={18} />
                      </a>
                      <a 
                        href="mailto:aryaarmdhn006@gmail.com"
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <FaEnvelope size={18} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h5 className="font-medium text-gray-800 dark:text-white mb-2">
                      Tech Stack
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center gap-1">
                        <SiReact /> React
                      </span>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                        <SiVite /> Vite
                      </span>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs flex items-center gap-1">
                        <SiTailwindcss /> Tailwind CSS
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-xs flex items-center gap-1">
                        <SiJavascript /> JavaScript
                      </span>
                    </div>
                  </div>
                  
            
                </div>
              )}
            </div>
          </AnimationWrapper>
          
          {/* App Version */}
          <AnimationWrapper animation="fade-up" delay={300}>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              <p>To-Do List Harian v3.5.0</p>
              <p className="mt-1">© 2025 All rights reserved</p>
            </div>
          </AnimationWrapper>
        </div>
      </div>
      
      {/* Modal Konfirmasi Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm animate-scale-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <FaExclamationCircle className="text-red-500" />
                Konfirmasi Reset Data
              </h3>
              <button 
                onClick={handleCloseResetModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <AiOutlineCloseCircle size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <FaTrash size={28} className="text-red-500" />
                </div>
              </div>
              
              <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
                Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <FaExclamationCircle className="inline mr-1" />
                  Semua tugas, statistik, dan riwayat akan dihapus permanen.
                </p>
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCloseResetModal}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetData}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Hapus Semua Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Edit Username */}
      {isEditUsernameModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm animate-scale-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Edit Nama Pengguna
              </h3>
              <button 
                onClick={handleCloseEditUsernameModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <AiOutlineCloseCircle size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <FaUser size={36} />
                </div>
              </div>
              
              <div className="mb-6">
                <label 
                  htmlFor="newUsername" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nama Pengguna Baru
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Masukkan nama pengguna"
                    maxLength={12}
                  />
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Minimal 3 karakter
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {newUsername.length}/12
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCloseEditUsernameModal}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleChangeUsername}
                  disabled={newUsername.trim().length < 3}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    newUsername.trim().length >= 3
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
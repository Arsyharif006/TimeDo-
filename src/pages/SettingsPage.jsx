// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { FaMoon, FaSun, FaDownload, FaTrash, FaBell, FaUser, FaInfoCircle } from 'react-icons/fa';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import AnimationWrapper from '../components/AnimationWrapper';
import toast from 'react-hot-toast';

const SettingsPage = ({ username, setUsername }) => {
  const { darkMode, toggleDarkMode, resetAllData, exportData } = useTaskContext();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditUsernameModalOpen, setIsEditUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Cek apakah notifikasi didukung
  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
  
  // Cek status izin notifikasi saat mount
  useEffect(() => {
    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, [notificationsSupported]);

  // Handler untuk meminta izin notifikasi
  const handleRequestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Izin notifikasi diberikan');
        new Notification('Notifikasi Diaktifkan', {
          body: 'Anda akan menerima notifikasi saat tugas selesai'
        });
      } else if (permission === 'denied') {
        toast.error('Izin notifikasi ditolak');
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

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <AnimationWrapper animation="fade-down">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Pengaturan
        </h1>
      </AnimationWrapper>
      
      <div className="space-y-4">
        {/* Username Settings */}
        <AnimationWrapper animation="fade-up" delay={50}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white mb-1">
                  Nama Pengguna
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {username ? `Halo, ${username}!` : 'Belum diatur'}
                </p>
              </div>
              <button
                onClick={handleOpenEditUsernameModal}
                className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 transition-colors"
                aria-label="Edit nama pengguna"
              >
                <FaUser size={18} />
              </button>
            </div>
          </div>
        </AnimationWrapper>
        
        {/* Toggle Dark Mode */}
        <AnimationWrapper animation="fade-up" delay={100}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white mb-1">
                  Tema
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {darkMode ? 'Mode gelap aktif' : 'Mode terang aktif'}
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-full transition-colors ${
                  darkMode 
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' 
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                }`}
                aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              >
                {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
              </button>
            </div>
          </div>
        </AnimationWrapper>
        
        {/* Notifikasi Desktop */}
        {notificationsSupported && (
          <AnimationWrapper animation="fade-up" delay={150}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Notifikasi
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notificationPermission === 'granted' 
                      ? 'Notifikasi desktop aktif' 
                      : notificationPermission === 'denied'
                        ? 'Notifikasi ditolak oleh browser'
                        : 'Aktifkan notifikasi desktop'}
                  </p>
                </div>
                <button
                  onClick={handleRequestNotificationPermission}
                  disabled={notificationPermission === 'granted' || notificationPermission === 'denied'}
                  className={`p-3 rounded-full transition-colors ${
                    notificationPermission === 'granted'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                      : notificationPermission === 'denied'
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  }`}
                  aria-label="Aktifkan notifikasi"
                >
                  <FaBell size={18} />
                </button>
              </div>
            </div>
          </AnimationWrapper>
        )}
        
        {/* Export Data */}
        <AnimationWrapper animation="fade-up" delay={200}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white mb-1">
                  Ekspor Data
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simpan data tugas sebagai file JSON
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 transition-colors"
                aria-label="Ekspor data"
              >
                <FaDownload size={18} />
              </button>
            </div>
          </div>
        </AnimationWrapper>
        
        {/* Reset Data */}
        <AnimationWrapper animation="fade-up" delay={250}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white mb-1">
                  Reset Data
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hapus semua data tugas
                </p>
              </div>
              <button
                onClick={handleOpenResetModal}
                className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 transition-colors"
                aria-label="Reset data"
              >
                <FaTrash size={18} />
              </button>
            </div>
          </div>
        </AnimationWrapper>
        
        {/* Informasi Aplikasi */}
        <AnimationWrapper animation="fade-up" delay={300}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-4">
            <div className="flex items-center mb-2">
              <FaInfoCircle className="text-blue-500 mr-2" />
              <h2 className="font-semibold text-gray-800 dark:text-white">
                Tentang Aplikasi
              </h2>
            </div>
            <div className="pl-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To-Do List Harian
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Versi 1.0.0
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Dibuat dengan React, Vite & Tailwind CSS
              </p>
            </div>
          </div>
        </AnimationWrapper>
      </div>
      
      {/* Modal Konfirmasi Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                Konfirmasi Reset Data
              </h3>
              <button 
                onClick={handleCloseResetModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <AiOutlineCloseCircle size={24} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-center mb-4 text-red-500">
                <FaTrash size={32} />
              </div>
              <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
                Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCloseResetModal}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-800 rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                Edit Nama Pengguna
              </h3>
              <button 
                onClick={handleCloseEditUsernameModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <AiOutlineCloseCircle size={24} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-center mb-4 text-blue-500">
                <FaUser size={32} />
              </div>
              
              <div className="mb-4">
                <label 
                  htmlFor="newUsername" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nama Pengguna Baru
                </label>
                <input
                  type="text"
                  id="newUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Masukkan nama pengguna"
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimal 3 karakter, maksimal 12 karakter
                </p>
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCloseEditUsernameModal}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-800 rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleChangeUsername}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
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
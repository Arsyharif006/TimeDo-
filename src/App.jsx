// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { TaskProvider } from './contexts/TaskContext';

// Import pages
import HomePage from './pages/HomePage';
import ManagementPage from './pages/ManagementPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';

// Import components
import BottomNavigation from './components/BottomNavigation';
import TimerOverlay from './components/TimerOverlay';
import Navbar from './components/Navbar';
import UsernameModal from './components/UsernameModal';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  // Load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      // Show username modal on first visit
      setShowUsernameModal(true);
    }
  }, []);
  
  // Handle username submission
  const handleUsernameSubmit = (name) => {
    setUsername(name);
    localStorage.setItem('username', name);
    setShowUsernameModal(false);
  };
  
  // Register service worker untuk background tasks (untuk versi production)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);
  
  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: false,
    });
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Efek untuk mencegah browser menutup jika ada timer aktif
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const activeTimerId = localStorage.getItem('activeTimerId');
      if (activeTimerId) {
        // Tampilkan konfirmasi jika ada timer aktif
        const message = 'Ada timer yang sedang berjalan. Yakin ingin meninggalkan halaman?';
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col items-center justify-center px-4 text-white">
        <div className="w-16 h-16 border-t-4 border-b-4 border-white rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-bold mb-2">To-Do List Harian</h1>
        <p className="text-blue-100">Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <TaskProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Navbar username={username} />
          
          <div className="flex-1">
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: 'white',
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: 'white',
                  }
                }
              }}
            />
            
            <Routes>
              <Route path="/" element={<HomePage username={username} />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/settings" element={<SettingsPage username={username} setUsername={setUsername} />} />
              {/* Redirect any unknown path to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Timer overlay yang akan muncul di semua halaman jika ada timer aktif */}
            <TimerOverlay />
            
            {/* Bottom Navigation */}
            <BottomNavigation />
          </div>
          
          {/* Username Modal */}
          <UsernameModal 
            isOpen={showUsernameModal} 
            onSubmit={handleUsernameSubmit} 
          />
        </div>
      </Router>
    </TaskProvider>
  );
};

export default App;

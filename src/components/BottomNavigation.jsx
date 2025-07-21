// src/components/BottomNavigation.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaHome, FaTasks, FaChartBar, FaCog } from 'react-icons/fa';

const BottomNavigation = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('/');
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location]);
  
  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Beranda' },
    { path: '/management', icon: <FaTasks />, label: 'Manajemen' },
    { path: '/statistics', icon: <FaChartBar />, label: 'Statistik' },
    { path: '/settings', icon: <FaCog />, label: 'Pengaturan' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-10">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center h-full w-1/4"
          >
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center py-1 w-full transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="text-xl mb-0.5">{item.icon}</div>
                <span className="text-xs">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
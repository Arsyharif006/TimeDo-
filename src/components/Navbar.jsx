// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaUser } from 'react-icons/fa';

const Navbar = ({ username }) => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 shadow-md">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-lg tracking-wide flex items-center">
          <span className="mr-2 text-white">TimeDo</span>
        </Link>
        
        <div className="flex items-center">
          {username && (
            <div className="flex items-center mr-3 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              <FaUser className="mr-2 text-white opacity-80" size={12} />
              <span>{username}</span>
            </div>
          )}
          
          <Link 
            to="/settings" 
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            title="Pengaturan"
          >
            <FaCog className="text-white" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
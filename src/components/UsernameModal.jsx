// src/components/UsernameModal.jsx
import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';

const UsernameModal = ({ onSubmit, isOpen }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Nama pengguna tidak boleh kosong');
      return;
    }
    
    if (username.trim().length < 3) {
      setError('Nama pengguna minimal 3 karakter');
      return;
    }
    
    onSubmit(username.trim());
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="bg-blue-600 text-white p-5 rounded-t-lg">
          <div className="flex items-center justify-center">
            <FaUser className="mr-3" size={24} />
            <h2 className="text-xl font-semibold text-center">Selamat Datang!</h2>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Silakan masukkan nama panggilan Anda untuk mulai menggunakan aplikasi To-Do List Harian.
          </p>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Nama Pengguna
            </label>
            <input 
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan nama Anda"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Mulai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;
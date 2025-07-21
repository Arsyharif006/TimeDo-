// src/pages/ManagementPage.jsx
import React, { useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { FaPlus, FaEdit, FaTrash, FaClock, FaCheck } from 'react-icons/fa';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import AnimationWrapper from '../components/AnimationWrapper';
import toast from 'react-hot-toast';

const ManagementPage = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTaskContext();
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  
  // State
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    duration: 60
  });

  // Handler untuk membuka modal tambah tugas
  const handleOpenAddModal = (day) => {
    setSelectedDay(day);
    setEditingTask(null);
    setFormData({ title: '', duration: 60 });
    setIsModalOpen(true);
  };

  // Handler untuk membuka modal edit tugas
  const handleOpenEditModal = (task) => {
    setSelectedDay(task.day);
    setEditingTask(task);
    setFormData({
      title: task.title,
      duration: task.duration
    });
    setIsModalOpen(true);
  };

  // Handler untuk menutup modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handler untuk perubahan input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler untuk submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi
    if (!formData.title.trim()) {
      toast.error("Judul tugas tidak boleh kosong");
      return;
    }
    
    if (parseInt(formData.duration) <= 0) {
      toast.error("Durasi harus lebih dari 0 menit");
      return;
    }
    
    if (editingTask) {
      // Update tugas yang ada
      updateTask(
        editingTask.id,
        { 
          ...formData,
          duration: parseInt(formData.duration)
        },
        selectedDay
      );
      toast.success(`Tugas "${formData.title}" diperbarui`);
    } else {
      // Tambah tugas baru
      addTask(selectedDay, formData.title, formData.duration);
    }
    
    handleCloseModal();
  };

  // Handler untuk menghapus tugas
  const handleDeleteTask = (id, day, title) => {
    if (window.confirm(`Yakin ingin menghapus tugas "${title}"?`)) {
      deleteTask(id, day);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <AnimationWrapper animation="fade-down">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Manajemen Tugas
        </h1>
      </AnimationWrapper>
      
      {/* Tabs untuk hari */}
      <div className="mb-6">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide">
          {days.map((day, index) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg mr-2 transition-colors whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-blue-600 text-white dark:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      {/* Daftar tugas untuk hari yang dipilih */}
      <AnimationWrapper animation="fade-up" delay={200}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">
              Tugas Hari {selectedDay}
            </h2>
            <button
              onClick={() => handleOpenAddModal(selectedDay)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              aria-label="Tambah tugas"
            >
              <FaPlus />
            </button>
          </div>
          
          {tasks[selectedDay] && tasks[selectedDay].length > 0 ? (
            <div className="space-y-3">
              {tasks[selectedDay].map((task) => (
                <div 
                  key={task.id} 
                  className={`p-3 border rounded-lg flex justify-between items-center transition-colors ${
                    task.isDone 
                      ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`${task.isDone ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {task.title}
                      </span>
                      {task.isDone && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          Selesai
                        </span>
                      )}
                      {task.isTimerRunning && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded animate-pulse">
                          Berjalan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <FaClock className="mr-1" size={12} />
                      <span>{task.duration} menit</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      aria-label="Edit tugas"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, selectedDay, task.title)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      aria-label="Hapus tugas"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FaClock className="mx-auto mb-2 text-gray-400" size={24} />
              <p>Belum ada tugas untuk hari {selectedDay}</p>
            </div>
          )}
        </div>
      </AnimationWrapper>
      
      {/* Modal untuk tambah/edit tugas */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                {editingTask ? 'Edit Tugas' : 'Tambah Tugas Baru'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <AiOutlineCloseCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="title">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan judul tugas"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="duration">
                  Durasi (menit)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="day">
                  Hari
                </label>
                <select
                  id="day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-800 font-bold py-2 px-4 rounded transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  {editingTask ? 'Simpan Perubahan' : 'Tambah Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
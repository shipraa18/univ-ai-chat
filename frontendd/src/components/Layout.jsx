import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  // Initialize theme from localStorage immediately to prevent flash
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if no preference
  });

  useEffect(() => {
    // Listen for theme changes from sidebar
    const handleThemeChange = (event) => {
      setIsDarkMode(event.detail.isDarkMode);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    
    // Theme is already initialized in useState, no need to load again

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <div className={`h-screen relative md:flex transition-colors duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-gray-200'
    }`}>
      <Sidebar />
      <main className={`w-full h-full md:flex-1 overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-black' : 'bg-gray-200'
      }`}>
        <Outlet />
      </main>
    </div>
  );
}



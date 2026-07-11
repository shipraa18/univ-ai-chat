import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chat from './Chat';
import UniversitySlider from './universitySlider';

export default function ChatArea({ onSubmit, placeholder }) {
  const navigate = useNavigate();
  // Initialize theme from localStorage immediately to prevent flash
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if no preference
  });

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = (event) => {
      setIsDarkMode(event.detail.isDarkMode);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    
    // Theme is already initialized in useState, no need to load again

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  const handleSubmit = async (text) => {
    if (typeof onSubmit === 'function') {
      try { await onSubmit(text); } catch (_) {}
    }
    navigate('/chat', { state: { initialQuery: text } });
  };

  return (
    <div className="h-full w-full flex flex-col items-start justify-center pt-2 pb-2 md:pt-4 md:pb-4 lg:pt-6 lg:pb-6">
      <div id="mainPanel" className={`relative w-full h-[95vh] rounded-[20px] flex flex-col items-center px-2 sm:px-3 md:px-4 pt-3 md:pt-4 pb-10 md:pb-14 transition-colors duration-300 ${
        isDarkMode ? 'bg-neutral-800' : 'bg-white'
      }`}>
        {/* Mobile toggle inside panel */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openSidebar'))}
          className={`absolute left-3 top-3 md:hidden w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 ${
            isDarkMode 
              ? 'bg-black/80 text-white' 
              : 'bg-gray-300/80 text-gray-800'
          }`}
          aria-label="Open sidebar"
        >
          <svg className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <h1 className={`font-sans text-2xl sm:text-3xl md:text-4xl font-semibold sm:font-bold md:font-extrabold tracking-tight text-center mt-12 mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Find your perfect
            <span className="block md:inline"> online degree in <span className="text-[#fd3329] font-semibold">60 seconds</span></span>
          </h1>
          <div className='mt-4 px-3 md:px-0'>
            <Chat onSubmit={handleSubmit} placeholder={placeholder} isDarkMode={isDarkMode} />
          </div>
        </div>
        <div className="mt-auto w-full pb-4 md:pb-6">
          <UniversitySlider/>
        </div>
      </div>
    </div>
  );
}



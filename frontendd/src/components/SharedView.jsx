import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchSharedChat } from '../lib/api';

export default function SharedView() {
  const { shareId } = useParams();
  const [data, setData] = useState({ messages: [], loading: true, error: '' });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchSharedChat(shareId);
        setData({ messages: Array.isArray(res.messages) ? res.messages : [], loading: false, error: '' });
      } catch (e) {
        setData({ messages: [], loading: false, error: 'Failed to load shared chat' });
      }
    })();
  }, [shareId]);

  useEffect(() => {
    const handleThemeChange = (e) => setIsDarkMode(e.detail.isDarkMode);
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  if (data.loading) return <div className="p-6 text-center">Loading...</div>;
  if (data.error) return <div className="p-6 text-center text-red-500">{data.error}</div>;

  return (
    <div className={`h-full w-full flex flex-col items-center justify-center py-4 ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}>
      <div className={`relative w-full h-[95vh] rounded-[20px] flex flex-col items-center px-3 md:px-4 pb-3 ${isDarkMode ? 'bg-neutral-800' : 'bg-white'}`}>
        <div className="w-full relative flex items-center justify-between py-2 md:py-3">
          <Link to="/" className={`hidden md:flex items-center justify-center w-10 h-10 ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-black'} transition-colors`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className={`absolute left-1/2 -translate-x-1/2 top-1 text-sm md:text-lg font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-800'}`}>Shared Chat</h1>
          <div className="w-12" />
        </div>

        <div className={`flex-1 w-full flex justify-center overflow-y-auto ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'} pt-2 min-h-0`}>
          <div className="w-full max-w-4xl px-2 md:px-3 space-y-2">
            {data.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg md:rounded-xl text-sm md:text-base leading-relaxed ${m.role === 'user'
                  ? `max-w-[85%] px-3 md:px-3.5 py-1.5 md:py-2.5 my-3 md:my-5 ${isDarkMode ? 'bg-slate-500 text-white' : 'bg-gray-200 text-gray-900'}`
                  : `max-w-full p-0 bg-transparent ${isDarkMode ? 'text-white/90' : 'text-gray-800'} border-0 chat-message rounded-none`}`}>
                  <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



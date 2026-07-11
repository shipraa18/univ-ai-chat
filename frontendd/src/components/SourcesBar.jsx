import React, { useState, useEffect } from 'react';

// Card-style source display with logos and headlines
// props.sources: Array<{ url: string, title?: string, logo?: string, headline?: string }>
export default function SourcesBar({ sources = [] }) {
  // Initialize theme from localStorage
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
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  if (!Array.isArray(sources) || sources.length === 0) return null;

  const uniqueByUrl = Array.from(new Map(sources
    .filter(s => typeof s?.url === 'string')
    .map(s => [s.url, s])
  ).values());

  return (
    <div className="mt-4 mb-2">
      <div className={`flex items-center gap-2 mb-3 transition-colors duration-300 ${
        isDarkMode ? 'text-white/85' : 'text-gray-800'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`w-6 h-6 transition-colors duration-300 ${
          isDarkMode ? 'text-white/80' : 'text-gray-700'
        }`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 18a6 6 0 100-12 6 6 0 000 12z" />
        </svg>
        <div className="text-base md:text-lg font-semibold uppercase tracking-wide">Sources</div>
      </div>
      <div className={`flex gap-2 overflow-x-auto ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'} pb-2`}>
        {uniqueByUrl.map((s, i) => {
          return <SourceCard key={i} source={s} isDarkMode={isDarkMode} />;
        })}
      </div>
    </div>
  );
}

function SourceCard({ source, isDarkMode }) {
  const [logoError, setLogoError] = useState(false);
  
  let hostname = '';
  try { hostname = new URL(source.url).hostname.replace(/^www\./i, ''); } catch (_) {}
  
  // Use provided logo or fallback to favicon
  const logoUrl = source.logo || (hostname ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128` : '');
  const sourceName = source.title?.trim() || hostname || source.url;
  const headline = source.headline || sourceName;
  const initials = sourceName.substring(0, 2).toUpperCase();
  
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex-shrink-0 w-[200px] md:w-[240px] rounded-lg border transition-all duration-200 overflow-hidden ${
        isDarkMode
          ? 'bg-neutral-700/80 hover:bg-neutral-700 border-white/10 hover:border-white/20'
          : 'bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400'
      }`}
    >
      <div className="p-3 flex flex-col gap-2">
        {/* Logo and Source Name Row */}
        <div className="flex items-center gap-2">
          {logoUrl && (
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-300'
            }`}>
              {!logoError ? (
                <img 
                  src={logoUrl} 
                  alt={sourceName}
                  className="w-6 h-6 object-contain"
                  loading="lazy"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-500/20' : 'bg-blue-200'
                }`}>
                  <span className={`text-[10px] font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white/90' : 'text-gray-800'
                  }`}>{initials}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`text-xs md:text-sm font-semibold truncate transition-colors duration-300 ${
              isDarkMode ? 'text-white/95' : 'text-gray-900'
            }`}>
              {sourceName}
            </div>
          </div>
        </div>
        
        {/* Headline */}
        <div className={`text-[11px] md:text-xs line-clamp-2 leading-snug transition-colors duration-300 ${
          isDarkMode ? 'text-white/75' : 'text-gray-600'
        }`}>
          {headline}
        </div>
      </div>
    </a>
  );
}



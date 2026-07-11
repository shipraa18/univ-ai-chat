

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Chat from './Chat';
import UniversitySlider from './universitySlider';
import { askQuery } from "../lib/api";
import { submitFeedback, fetchFeedbackStats } from "../lib/api";
import Sidebar from './Sidebar.jsx';
import SourcesBar from './SourcesBar.jsx';
import ShareModal from './ShareModal.jsx';
import { createShareLink } from '../lib/api';
import { fetchSources } from '../lib/api';

import { useLocation, useNavigate } from 'react-router-dom';

const Home = ({ __forceChatMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChatActive, setIsChatActive] = useState(__forceChatMode);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPlaceholder, setSuggestedPlaceholder] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const [feedbackMap, setFeedbackMap] = useState({}); // { [index]: 'up' | 'down' }
  const [finalizedMap, setFinalizedMap] = useState({}); // { [index]: true when streaming finished }
  const [copiedMap, setCopiedMap] = useState({}); // { [index]: true when copied }
  const scrollContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const [relatedMap, setRelatedMap] = useState({}); // { [index]: string[] }
  const [sourcesMap, setSourcesMap] = useState({}); // { [index]: Array<{url, title?}> }
  // Initialize theme from localStorage immediately to prevent flash
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if no preference
  });
  // Determine the latest assistant message index for feedback controls
  const lastAssistantIndex = messages.reduce((acc, m, i) => (m.role !== 'user' ? i : acc), -1);
  // Track which assistant messages need condensed table styling
  const [condensedMap, setCondensedMap] = useState({}); // { [index]: true }
  // Throttle message updates during streaming to reduce flickering
  const [throttledMessages, setThrottledMessages] = useState([]);
  const [showHeader, setShowHeader] = useState(true);
  const [showHamburger, setShowHamburger] = useState(true);
  const prevScrollTopRef = useRef(0);
  // Track whether the user is at bottom and only auto-scroll if they are
  useEffect(() => {
    // Hydrate persisted state on first mount
    try {
      const savedMessages = localStorage.getItem('home_chat_messages');
      const savedActive = localStorage.getItem('home_isChatActive');
      const savedPlaceholder = localStorage.getItem('home_placeholder');
      console.log('Hydrating from localStorage:', { savedMessages, savedActive, savedPlaceholder });
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          console.log('Restored messages:', parsed);
        }
      }
      if (savedActive != null) {
        setIsChatActive(savedActive === 'true');
        console.log('Restored chat active state:', savedActive === 'true');
      }
      if (savedPlaceholder) setSuggestedPlaceholder(savedPlaceholder);
    } catch (error) {
      console.error('Error hydrating from localStorage:', error);
    }

    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 60;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      isAtBottomRef.current = atBottom;
      const current = el.scrollTop;
      const prev = prevScrollTopRef.current;
      if (current > prev + 10) {
        setShowHeader(false);
        setShowHamburger(false);
      } else if (current < prev - 10) {
        setShowHeader(true);
        setShowHamburger(true);
      }
      prevScrollTopRef.current = current;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // When messages grow, scroll to bottom only if user was at bottom
  // Add smooth scrolling during streaming for better line-by-line effect
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        // Smooth scroll during streaming, instant when complete
        if (isLoading) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  }, [throttledMessages.length, isLoading]);

  // After render, detect tables that would overflow and mark them to use condensed styles
  // Only run this when messages are finalized to reduce flickering during streaming
  useEffect(() => {
    if (isLoading) return; // Skip during streaming to prevent flicker
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Use requestAnimationFrame to defer DOM queries
    const timeoutId = setTimeout(() => {
      const next = {};
      messages.forEach((m, i) => {
        if (m.role === 'user') return;
        if (!finalizedMap[i]) return; // Only check finalized messages
        const msgRoot = container.querySelector(`[data-message-index="${i}"]`);
        if (!msgRoot) return;
        const table = msgRoot.querySelector('table');
        if (!table) return;
        const parent = table.parentElement;
        if (!parent) return;
        const needsScroll = table.scrollWidth > parent.clientWidth;
        if (needsScroll) next[i] = true;
      });
      setCondensedMap(next);
    }, 100); // Small delay to ensure DOM is stable
    
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, finalizedMap]);

  // Smooth line-by-line streaming effect without flickering
  useEffect(() => {
    if (isLoading) {
      // During streaming, implement line-by-line effect with smooth transitions
      const timer = setTimeout(() => {
        setThrottledMessages([...messages]);
      }, 80); // Faster updates for smoother line-by-line effect
      return () => clearTimeout(timer);
    } else {
      // When not streaming, update immediately
      setThrottledMessages([...messages]);
    }
  }, [messages, isLoading]);

  // Persist key UI state
  useEffect(() => {
    try {
      localStorage.setItem('home_chat_messages', JSON.stringify(messages));
      localStorage.setItem('home_isChatActive', String(isChatActive));
      localStorage.setItem('home_placeholder', suggestedPlaceholder || '');
      console.log('Saved to localStorage:', { messages: messages.length, isChatActive, suggestedPlaceholder });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [messages, isChatActive, suggestedPlaceholder]);

  const processResponse = (text) => {
    let processed = text || '';

    processed = processed
      .replace(/<hr[^>]*>/gi, '\n\n---\n\n')
      .replace(/\n\s*---\s*\n/g, '\n\n---\n\n');

    processed = processed.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1');
    processed = processed.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1');
    processed = processed.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1');
    processed = processed.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');

    processed = processed.replace(/<[^>]+>/g, '');

    processed = processed.replace(/^\s*•\s+/gm, '- ');

    processed = processed.replace(/(\S)\s*(\*\*Would you like to know[^*]*\*\*)\s*$/i, '$1\n\n$2');

    return processed;
  };

  const extractSources = (text) => {
    if (!text) return [];
    const urls = Array.from(new Set(
      (text.match(/https?:\/\/[^\s)]+/gi) || [])
        .map(u => u.replace(/[)\]\.,]+$/g, ''))
    ));
    return urls.map(url => ({ url }));
  };

  // Function to get memoized components for a specific message index with smooth transitions
  const getComponentsForMessage = useCallback((messageIndex) => ({
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto -mx-2 md:mx-0">
        <table className={`border-collapse transition-all duration-200 ${condensedMap[messageIndex] ? 'text-[12px] md:text-[13px]' : 'text-[14px] md:text-[15px]'}`} {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className={`border ${condensedMap[messageIndex] ? 'px-2 py-1' : 'px-3 py-2'} text-left break-words whitespace-nowrap md:whitespace-normal transition-all duration-200 ${
          isDarkMode 
            ? 'bg-gray-700 border-white/20 text-white' 
            : 'bg-gray-600 border-gray-300 text-white'
        }`}
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        className={`border ${condensedMap[messageIndex] ? 'px-2 py-1' : 'px-3 py-2'} break-words whitespace-nowrap md:whitespace-normal transition-all duration-200 ${
          isDarkMode 
            ? 'border-white/20 text-white/90' 
            : 'border-gray-300 text-gray-800'
        }`}
        {...props}
      />
    ),
    h1: ({ node, ...props }) => (
      <h1 className={`text-2xl md:text-3xl font-bold mb-6 mt-8 transition-colors duration-200 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`} {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className={`text-xl md:text-2xl font-semibold mb-5 mt-6 transition-colors duration-200 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`} {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className={`text-lg md:text-xl font-medium mb-4 mt-5 transition-colors duration-200 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`} {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className={`mb-4 leading-relaxed transition-colors duration-200 ${
        isDarkMode ? 'text-white/90' : 'text-gray-800'
      }`} {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className={`list-disc pl-6 mb-6 transition-colors duration-200 ${
        isDarkMode ? 'text-white/90' : 'text-gray-800'
      }`} {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className={`list-decimal pl-6 mb-6 transition-colors duration-200 ${
        isDarkMode ? 'text-white/90' : 'text-gray-800'
      }`} {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className={`mb-2 transition-colors duration-200 ${
        isDarkMode ? 'text-white/90' : 'text-gray-800'
      }`} {...props} />
    ),
    hr: ({ node, ...props }) => (
      <hr className={`my-8 border-0 h-px ${
        isDarkMode ? 'bg-white/20' : 'bg-gray-300'
      }`} {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className={`border-l-4 pl-4 my-6 italic ${
        isDarkMode ? 'border-white/30 text-white/80' : 'border-gray-400 text-gray-700'
      }`} {...props} />
    )
  }), [isDarkMode, condensedMap]);

  const handleQuery = async (queryText, conversationHistory) => {
    setIsLoading(true);
    
    try {
      let liveText = '';
      const placeholderIndex = messages.length + 1; // after user message appended by caller
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      (async () => {
        try {
          const early = await fetchSources(queryText);
          if (Array.isArray(early) && early.length > 0) {
            setSourcesMap(prev => ({ ...prev, [placeholderIndex]: early }));
          }
        } catch (_) {}
      })();

      const { fullResponse, followUpQuestions, sources: serverSources } = await askQuery(queryText, conversationHistory, (delta) => {
        liveText += delta;
        // Reveal only completed lines while streaming
        const parts = liveText.split('\n');
        const completed = parts.length > 1 ? parts.slice(0, -1).join('\n') : '';
        const processedLive = processResponse(completed);
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: processedLive };
          return copy;
        });
      });

      const processedResponse = processResponse(fullResponse);
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: processedResponse };
        return copy;
      });
      setFinalizedMap(prev => ({ ...prev, [placeholderIndex]: true }));
      // Extract sources for this assistant message
      try {
        const sources = extractSources(processedResponse);
        const merged = Array.isArray(serverSources) && serverSources.length > 0
          ? [...serverSources, ...sources]
          : sources;
        if (merged.length > 0) setSourcesMap(prev => ({ ...prev, [placeholderIndex]: merged }));
      } catch (_) {}
      if (Array.isArray(followUpQuestions) && followUpQuestions.length > 0) {
        setRelatedMap(prev => ({ ...prev, [placeholderIndex]: followUpQuestions.slice(0, 6) }));
      }

      // Handle follow-ups
      try {
        const text = fullResponse || '';
        const headingRegex = /(Follow-?up Questions|Here are some follow-?up questions[^:]*:|Would you like me to:)[\s\S]*?/i;
        const match = text.match(headingRegex);
        if (match) {
          const tail = text.slice(text.indexOf(match[0]) + match[0].length);
          const bulletMatch = tail.match(/\n\s*[•\-]\s*(.+)/);
          if (bulletMatch && bulletMatch[1]) {
            setSuggestedPlaceholder(bulletMatch[1].trim());
          } else if (Array.isArray(followUpQuestions) && followUpQuestions.length > 0) {
            setSuggestedPlaceholder(followUpQuestions[0]);
          }
        } else if (Array.isArray(followUpQuestions) && followUpQuestions.length > 0) {
          setSuggestedPlaceholder(followUpQuestions[0]);
        }
      } catch (_) {}
    } catch (err) {
      console.error("Query failed", err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (query) => {
    const userMessage = { role: 'user', content: query };
    setMessages([userMessage]);
    setIsChatActive(true);
    await handleQuery(query, []);
  };

  const handleBackToHome = () => {
    setIsChatActive(false);
    setMessages([]);
    setSuggestedPlaceholder("");
    // Clear localStorage when intentionally going back to home
    try {
      localStorage.removeItem('home_chat_messages');
      localStorage.removeItem('home_isChatActive');
      localStorage.removeItem('home_placeholder');
    } catch (_) {}
    navigate('/');
  };

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const openShare = async () => {
    try {
      const { url } = await createShareLink({ messages });
      try {
        const built = new URL(url);
        const current = window.location.origin;
        const normalized = built.pathname.startsWith('/share/') && built.origin !== current
          ? `${current}${built.pathname}`
          : url;
        setShareUrl(normalized);
      } catch (_) {
        setShareUrl(url);
      }
      setShareOpen(true);
    } catch (e) { console.error('share failed', e); }
  };

  // If navigated from ChatArea with an initial query, run once only when no persisted messages
  useEffect(() => {
    if (!__forceChatMode) return;
    if (messages.length > 0) return;
    if (location?.state?.initialQuery) {
      const q = String(location.state.initialQuery || '').trim();
      if (q) {
        history.replaceState({}, '');
        (async () => {
          const userMessage = { role: 'user', content: q };
          setMessages([userMessage]);
          setIsChatActive(true);
          await handleQuery(q, []);
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [__forceChatMode, messages.length]);

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

  return (
    <div className={`h-full transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}>
      {/* Main content area (sidebar is now provided by Layout) */}
      <div className={`h-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}>
        <div className="h-full flex flex-col items-start justify-center pt-2 pb-2 md:pt-4 md:pb-4 lg:pt-6 lg:pb-6">
          <div id="mainPanel" className={`relative w-full h-[95vh] rounded-[20px] flex flex-col items-center px-2 sm:px-3 md:px-4 pt-3 md:pt-4 transition-all duration-300 ${isChatActive ? 'pb-3' : 'pb-10 md:pb-14'} ${
            isDarkMode ? 'bg-neutral-800' : 'bg-white'
          }`}>
            {/* Mobile sidebar toggle button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openSidebar'))}
              className={`absolute left-3 top-3 md:hidden w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 ${
                showHamburger ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${
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

        {!isChatActive && !__forceChatMode ? (
            <>
              <div className="flex-1 w-full flex flex-col items-center justify-center">
                <h1 className="text-white/75 text-2xl md:text-4xl font-semibold tracking-tight text-center mb-6">
                Find your perfect
                online degree in 60 seconds
                </h1>
                <div className='mt-3 px-2 md:px-0'>
                  <Chat onSubmit={handleChatSubmit} placeholder={suggestedPlaceholder} />
                </div>
              </div>

              <div className="mt-auto w-full pb-4 md:pb-6">
                <UniversitySlider/>
              </div>
            </>
          ) : (
            <>
              {/* Header + in-panel mobile toggle (hide on scroll down) */}
              <div className="w-full relative flex items-center justify-between py-2 md:py-3">
                <button
                  onClick={handleBackToHome}
                  className={`hidden md:flex items-center justify-center w-10 h-10 transition-colors ${
                    isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className={`absolute left-1/2 -translate-x-1/2 top-1 text-sm md:text-lg font-semibold transition-opacity duration-200 ${showHeader ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-0 ${isDarkMode ? 'text-white/80' : 'text-gray-800'}`}>University AI Chat</h1>
                <div className="flex items-center"></div>
              </div>

              {/* Chat messages */}
              <div ref={scrollContainerRef} className="flex-1 w-full flex justify-center overflow-y-auto scrollbar-hidden pt-8 md:pt-10 pb-2 min-h-0">
                <div className="w-full max-w-4xl px-2 md:px-3 space-y-2">
                  {throttledMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg md:rounded-xl text-sm md:text-base leading-relaxed ${
                          message.role === 'user'
                            ? `max-w-[85%] px-3 md:px-3.5 py-1.5 md:py-2.5 my-3 md:my-5 ${
                                isDarkMode ? 'bg-slate-500 text-white' : 'bg-gray-200 text-gray-800'
                              }`
                            : `max-w-full p-0 bg-transparent border-0 chat-message rounded-none ${
                                isDarkMode ? 'text-white/90' : 'text-gray-800'
                              }`
                        }`}
                        style={{ overflowX: 'hidden' }}
                        classNameGroup
                        data-message-index={index}
                      >
                        {message.role !== 'user' && Array.isArray(sourcesMap[index]) && sourcesMap[index].length > 0 && (
                          <SourcesBar sources={sourcesMap[index]} />
                        )}
                        <div className={`prose max-w-none scrollbar-hidden transition-opacity duration-300 ${
                          isDarkMode ? 'prose-invert' : 'prose-gray'
                        } ${isLoading && index === throttledMessages.length - 1 && !finalizedMap[index] ? 'opacity-90' : 'opacity-100'}`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={getComponentsForMessage(index)}
                          >
  {message.content}
                          </ReactMarkdown>
                          {/* Typing cursor for streaming messages */}
                          {isLoading && index === throttledMessages.length - 1 && !finalizedMap[index] && (
                            <span className={`inline-block w-2 h-5 ml-1 ${
                              isDarkMode ? 'bg-white' : 'bg-gray-800'
                            } animate-pulse`}></span>
                          )}
                        </div>
                        {message.role !== 'user' && message.content && finalizedMap[index] && (
                          <div className="mt-1 flex items-center justify-start gap-1">
                            <button
                              aria-label="Copy response"
                              className={`cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'bg-white/10 hover:bg-white/20 text-white/80' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                              }`}
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                setCopiedMap(prev => ({ ...prev, [index]: true }));
                                setTimeout(() => {
                                  setCopiedMap(prev => ({ ...prev, [index]: false }));
                                }, 2000);
                              }}
                            >
                              {copiedMap[index] ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <button
                              aria-label="Like this answer"
                              className={`cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'bg-white/10 hover:bg-white/20 text-white/80' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                              }`}
                              onClick={async () => {
                                console.log('Like button clicked for index:', index);
                                const newSentiment = feedbackMap[index] === 'up' ? null : 'up';
                                setFeedbackMap(prev => ({ ...prev, [index]: newSentiment }));
                                try {
                                  const r = await submitFeedback({
                                    sentiment: newSentiment || 'neutral',
                                    message: message.content,
                                    question: messages.find(m => m.role === 'user')?.content,
                                    conversationHistory: messages,
                                    meta: { index }
                                  });
                                  console.log('Feedback submitted successfully:', r);
                                } catch (e) { 
                                  console.error('Feedback submission error:', e);
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={feedbackMap[index] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 transition-colors duration-300 ${
                                feedbackMap[index] === 'up' 
                                  ? (isDarkMode ? 'text-white' : 'text-gray-800')
                                  : (isDarkMode ? 'text-white/80' : 'text-gray-600')
                              }`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21h-3A1.5 1.5 0 0 1 3 19.5v-7A1.5 1.5 0 0 1 4.5 11h3V21Zm3-10.5 3.75-6.5a1.5 1.5 0 0 1 2.63 1.5L15.75 9h3.38a1.5 1.5 0 0 1 1.48 1.74l-1.2 7.2A2.25 2.25 0 0 1 17.17 20H10.5V10.5Z" />
                              </svg>
                            </button>
                            <span className="text-xs text-white/50" data-feedback-up-count></span>
                            <button
                              aria-label="Dislike this answer"
                              className={`cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'bg-white/10 hover:bg-white/20 text-white/80' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                              }`}
                              onClick={async () => {
                                console.log('Dislike button clicked for index:', index);
                                const newSentiment = feedbackMap[index] === 'down' ? null : 'down';
                                setFeedbackMap(prev => ({ ...prev, [index]: newSentiment }));
                                try {
                                  const r = await submitFeedback({
                                    sentiment: newSentiment || 'neutral',
                                    message: message.content,
                                    question: messages.find(m => m.role === 'user')?.content,
                                    conversationHistory: messages,
                                    meta: { index }
                                  });
                                  console.log('Feedback submitted successfully:', r);
                                } catch (e) { 
                                  console.error('Feedback submission error:', e);
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={feedbackMap[index] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 rotate-180 transition-colors duration-300 ${
                                feedbackMap[index] === 'down' 
                                  ? (isDarkMode ? 'text-white' : 'text-gray-800')
                                  : (isDarkMode ? 'text-white/80' : 'text-gray-600')
                              }`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21h-3A1.5 1.5 0 0 1 3 19.5v-7A1.5 1.5 0 0 1 4.5 11h3V21Zm3-10.5 3.75-6.5a1.5 1.5 0 0 1 2.63 1.5L15.75 9h3.38a1.5 1.5 0 0 1 1.48 1.74l-1.2 7.2A2.25 2.25 0 0 1 17.17 20H10.5V10.5Z" />
                              </svg>
                        </button>
                        <button
                          aria-label="Share this answer"
                          className={`cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-white/10 hover:bg-white/20 text-white/80' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                          onClick={openShare}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 7.5 12 4l3.5 3.5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5" />
                          </svg>
                        </button>
                            <span className="text-xs text-white/50" data-feedback-down-count></span>
                          </div>
                        )}
                        {message.role !== 'user' && finalizedMap[index] && Array.isArray(relatedMap[index]) && relatedMap[index].length > 0 && (
                          <div className="mt-4 border-t border-white/10 pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${isDarkMode ? 'text-white/80' : 'text-gray-700'} w-6 h-6 md:w-7 md:h-7`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8-4 8 4-8 4-8-4zM4 16l8 4 8-4M4 12l8 4 8-4" />
                              </svg>
                              <div className={`text-base md:text-lg font-semibold uppercase tracking-wide ${isDarkMode ? 'text-white/85' : 'text-gray-800'}`}>Related</div>
                            </div>
                            <div className="flex flex-col divide-y divide-white/10">
                              {relatedMap[index].map((q, i) => (
                                <button
                                  key={i}
                                  onClick={async () => {
                                    const userMessage = { role: 'user', content: q };
                                    setMessages(prev => [...prev, userMessage]);
                                    await handleQuery(q, messages);
                                  }}
                                  className={`group cursor-pointer w-full flex items-center justify-between gap-3 py-2 px-2 rounded-md ${isDarkMode ? 'text-white/85 hover:text-white hover:bg-white/5' : 'text-gray-800 hover:text-black hover:bg-gray-200'}`}
                                >
                                  <span className="truncate">{q}</span>
                                  <span className={`${isDarkMode ? 'text-white/70' : 'text-gray-700'} cursor-pointer`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5 cursor-pointer">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                    </svg>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
          <ShareModal open={shareOpen} url={shareUrl} onClose={() => setShareOpen(false)} />
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={`${isDarkMode ? 'bg-neutral-800 text-white/90 border border-white/10' : 'bg-gray-200 text-gray-800 border border-gray-300'} rounded-lg md:rounded-xl px-3 py-2`}>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-white/60' : 'bg-gray-600'}`}></div>
                            <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-white/60' : 'bg-gray-600'}`} style={{animationDelay: '0.1s'}}></div>
                            <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-white/60' : 'bg-gray-600'}`} style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="w-full flex-shrink-0 pt-1 pb-1 px-3 md:px-0">
                <Chat 
                  onSubmit={async (query) => {
                    const userMessage = { role: 'user', content: query };
                    setMessages(prev => [...prev, userMessage]);
                    await handleQuery(query, messages);
                  }} 
                  isInChatMode={true}
                  placeholder={suggestedPlaceholder}
                  isDarkMode={isDarkMode}
                />
                {throttledMessages.some(m => m.role !== 'user') && (
                  <p className={`mt-2 text-center text-[11px] md:text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
                    This AI can make mistakes. Please double-check responses.
                  </p>
                )}
              </div>
            </>
          )}
          </div>      
        </div>
      </div>
    </div>
  );
};

export default Home;


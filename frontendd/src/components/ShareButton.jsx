import React, { useState } from 'react';
import { createShareLink } from '../lib/api';

export default function ShareButton({ messages = [] }) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    if (!Array.isArray(messages) || messages.length === 0) return;
    setIsSharing(true);
    try {
      const { shareId, url } = await createShareLink({ messages });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Share failed', e);
      alert('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={onShare}
      disabled={isSharing || !messages?.length}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isSharing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'
      } bg-white/5 text-white`}
      title="Create a shareable link and copy to clipboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 7.5 12 4l3.5 3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5" />
      </svg>
      {copied ? 'Link Copied' : (isSharing ? 'Sharing...' : 'Share')}
    </button>
  );
}



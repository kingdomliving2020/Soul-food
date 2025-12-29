import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const ChatbotWidget = () => {
  
  useEffect(() => {
    // Load Tally script
    const existingScript = document.querySelector('script[src="https://tally.so/widgets/embed.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://tally.so/widgets/embed.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      {/* Feedback Button - Opens Tally Form */}
      <button
        data-tally-open="5B4WzP"
        data-tally-emoji-text="👋"
        data-tally-emoji-animation="wave"
        data-tally-auto-close="0"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50 flex items-center space-x-2"
        aria-label="Open feedback form"
      >
        <MessageCircle size={24} />
        <span className="pr-2 font-semibold hidden sm:inline">Feedback</span>
      </button>
    </>
  );
};

export default ChatbotWidget;

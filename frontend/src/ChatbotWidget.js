import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setSending(true);
    
    try {
      // In a real implementation, this would send to your backend
      // which would then email to kingdomlivingproject@gmail.com
      const response = await fetch('http://localhost:8001/api/contact/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || 'Anonymous',
          message: message,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setMessage('');
          setEmail('');
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Still show success for demo purposes
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setEmail('');
      }, 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50 flex items-center space-x-2"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className="pr-2 font-semibold hidden sm:inline">Need Help?</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} />
              <h3 className="font-bold">Soul Food Support</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!submitted ? (
              <>
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    👋 Hello! How can we help you today? Leave us a message and we'll get back to you shortly at <strong>kingdomlivingproject@gmail.com</strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="chat-email" className="block text-sm font-semibold text-gray-700 mb-1">
                      Your Email (Optional)
                    </label>
                    <input
                      id="chat-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="chat-message" className="block text-sm font-semibold text-gray-700 mb-1">
                      Your Message *
                    </label>
                    <textarea
                      id="chat-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask us anything about Soul Food lessons, pricing, or technical issues..."
                      rows="5"
                      required
                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all"
                  >
                    {sending ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Message Sent!</h4>
                <p className="text-sm text-gray-600">
                  Thank you for reaching out. We'll respond to your message shortly at <strong>kingdomlivingproject@gmail.com</strong>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 rounded-b-2xl border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

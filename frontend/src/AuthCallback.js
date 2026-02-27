import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing sign in...');
  
  useEffect(() => {
    const processCallback = async () => {
      // Get session_id from URL params (from Emergent Auth redirect)
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        setMessage('Invalid callback - missing session ID');
        toast.error('Authentication failed');
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }
      
      try {
        setMessage('Verifying your account...');
        
        const response = await fetch(`${API}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }
        
        // Store auth data
        localStorage.setItem('soul_food_token', data.access_token);
        localStorage.setItem('soul_food_user', JSON.stringify(data.user));
        
        setStatus('success');
        setMessage(data.message || 'Welcome!');
        toast.success(data.message || 'Signed in successfully!');
        
        // Check if 2FA setup is required
        if (data.requires_2fa_setup) {
          setTimeout(() => navigate('/2fa-setup'), 1500);
          return;
        }
        
        // Check if 2FA verification is needed
        if (data.requires_2fa_verification) {
          setTimeout(() => navigate('/2fa-verify'), 1500);
          return;
        }
        
        // Redirect to return URL or home
        const returnTo = localStorage.getItem('auth_return_to') || '/my-library';
        localStorage.removeItem('auth_return_to');
        setTimeout(() => navigate(returnTo), 1500);
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Authentication failed');
        toast.error(err.message || 'Authentication failed');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };
    
    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
      <Toaster position="top-right" />
      
      <div className="text-center">
        <div className="mb-6">
          <img src="/soul-food-logo.png" alt="Soul Food" className="h-28 w-auto mx-auto" />
        </div>
        
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-lg text-slate-600">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg text-slate-800 font-semibold">{message}</p>
            <p className="text-sm text-slate-500 mt-2">Redirecting...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg text-red-600 font-semibold">{message}</p>
            <p className="text-sm text-slate-500 mt-2">Redirecting to sign in...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

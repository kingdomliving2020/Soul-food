import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Shield, ArrowLeft, Loader2, Mail, Smartphone } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Get user info from location state or localStorage
  const userId = location.state?.userId;
  const returnTo = location.state?.returnTo || '/my-library';
  const user = JSON.parse(localStorage.getItem('soul_food_user') || '{}');
  const token = localStorage.getItem('soul_food_token');
  
  // Redirect if no user context
  useEffect(() => {
    if (!userId && !user.id) {
      toast.error('Session expired. Please login again.');
      navigate('/auth');
    }
  }, [userId, user.id, navigate]);

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          code: verificationCode,
          user_id: userId || user.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }
      
      // Store the new token if provided
      if (data.token) {
        localStorage.setItem('soul_food_token', data.token);
        localStorage.setItem('soulFoodToken', data.token);
      }
      
      // Update user in localStorage
      if (data.user) {
        localStorage.setItem('soul_food_user', JSON.stringify(data.user));
      }
      
      toast.success('Verification successful!');
      
      // Redirect to original destination
      setTimeout(() => navigate(returnTo), 1000);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    try {
      const response = await fetch(`${API}/auth/2fa/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          user_id: userId || user.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend code');
      }
      
      toast.success('New code sent to your email!');
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="mb-4 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>
        
        <Card className="shadow-2xl border-2 border-purple-200">
          <CardHeader className="text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-t-lg py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
            <p className="text-white/80 mt-2">Enter the code from your authenticator app or email</p>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Method info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Check your email or authenticator app</p>
                  <p className="text-sm text-purple-600">Enter the 6-digit verification code</p>
                </div>
              </div>
            </div>
            
            {/* Code input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-700 font-medium">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono h-14 border-2 border-purple-200 focus:border-purple-500"
                  autoFocus
                />
              </div>
              
              <Button
                onClick={verifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </div>
            
            {/* Resend link */}
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">Didn't receive a code?</p>
              <Button
                variant="link"
                onClick={resendCode}
                disabled={resending}
                className="text-purple-600 hover:text-purple-700"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Code'
                )}
              </Button>
            </div>
            
            {/* Help text */}
            <div className="text-center text-sm text-slate-500">
              <p>Having trouble? Contact <a href="mailto:support@kingdom-soul.com" className="text-purple-600 hover:underline">support@kingdom-soul.com</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorVerify;

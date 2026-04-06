import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Shield, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('intro'); // 'intro', 'sending', 'verify', 'done'
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  const user = JSON.parse(localStorage.getItem('soul_food_user') || '{}');
  const token = localStorage.getItem('soul_food_token');
  
  useEffect(() => {
    if (!token) {
      navigate('/auth', { state: { returnTo: '/2fa-setup' } });
    }
  }, [token, navigate]);

  const sendCode = async () => {
    setLoading(true);
    setStep('sending');
    try {
      const response = await fetch(`${API}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method: 'email' })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to send code');
      
      toast.success('Verification code sent to your email!');
      setStep('verify');
    } catch (err) {
      toast.error(err.message);
      setStep('intro');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode, user_id: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Invalid code');
      
      const updatedUser = { ...user, tfa_enabled: true };
      localStorage.setItem('soul_food_user', JSON.stringify(updatedUser));
      
      toast.success('2FA enabled successfully!');
      setStep('done');
      
      const returnTo = location.state?.returnTo || '/my-library';
      setTimeout(() => navigate(returnTo), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate(location.state?.returnTo || '/my-library')}
          className="mb-4 text-slate-600 hover:text-slate-800"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'intro' ? 'Skip for now' : 'Back'}
        </Button>
        
        <Card className="shadow-xl border border-purple-100">
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold" data-testid="tfa-title">
              {step === 'done' ? '2FA Enabled!' : 'Secure Your Account'}
            </CardTitle>
            <p className="text-purple-100 text-sm mt-1">
              {step === 'done' 
                ? 'Your account is now protected' 
                : 'Get a verification code via email when you log in'}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Intro */}
            {step === 'intro' && (
              <div className="space-y-5" data-testid="tfa-intro">
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Mail className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">How it works</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Each time you log in, we'll send a 6-digit code to <strong>{user.email}</strong>. 
                      Enter the code to access your account. Simple and secure.
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={sendCode}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                  data-testid="send-code-btn"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Verification Code to My Email
                </Button>
                
                {user.role !== 'instructor' && user.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="w-full text-slate-400"
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            )}

            {/* Sending */}
            {step === 'sending' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-slate-500">Sending code to {user.email}...</p>
              </div>
            )}

            {/* Verify */}
            {step === 'verify' && (
              <div className="space-y-5" data-testid="tfa-verify">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <Mail className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Code sent to <strong>{user.email}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Check your inbox and spam folder</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verifyCode">Enter 6-digit code</Label>
                  <Input
                    id="verifyCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                    data-testid="verify-code-input"
                  />
                  <p className="text-xs text-slate-500 text-center">Expires in 10 minutes</p>
                </div>
                
                <Button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="verify-btn"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Verify & Enable 2FA</>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={sendCode}
                  disabled={loading}
                  className="w-full text-slate-500"
                  data-testid="resend-btn"
                >
                  Resend code
                </Button>
              </div>
            )}

            {/* Done */}
            {step === 'done' && (
              <div className="text-center py-6" data-testid="tfa-done">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-800">2FA is now active!</p>
                <p className="text-sm text-slate-500 mt-2">Redirecting to your library...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorSetup;

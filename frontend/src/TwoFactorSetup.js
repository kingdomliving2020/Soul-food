import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Shield, Mail, Smartphone, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('choose'); // 'choose', 'email', 'totp', 'verify'
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [secretKey, setSecretKey] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('soul_food_user') || '{}');
  const token = localStorage.getItem('soul_food_token');
  
  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate('/auth', { state: { returnTo: '/2fa-setup' } });
    }
  }, [token, navigate]);

  const setupEmail2FA = async () => {
    setLoading(true);
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
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to setup 2FA');
      }
      
      toast.success('Verification code sent to your email!');
      setSelectedMethod('email');
      setStep('verify');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupTOTP2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method: 'totp' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to setup authenticator');
      }
      
      setQrCodeData(data.qr_code);
      setSecretKey(data.secret);
      setSelectedMethod('totp');
      setStep('totp');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          code: verificationCode,
          user_id: user.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }
      
      // Update user in localStorage with 2FA enabled
      const updatedUser = { ...user, tfa_enabled: true };
      localStorage.setItem('soul_food_user', JSON.stringify(updatedUser));
      
      toast.success('2FA enabled successfully!');
      
      // Redirect to dashboard or original destination
      const returnTo = location.state?.returnTo || '/my-library';
      setTimeout(() => navigate(returnTo), 1500);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipSetup = () => {
    toast.info('You can set up 2FA later in your account settings.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => step === 'choose' ? navigate('/') : setStep('choose')}
          className="mb-4 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'choose' ? 'Skip for now' : 'Back'}
        </Button>
        
        <Card className="shadow-2xl border-2 border-purple-200">
          <CardHeader className="text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-t-lg py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'choose' && 'Set Up Two-Factor Authentication'}
              {step === 'email' && 'Email Verification'}
              {step === 'totp' && 'Authenticator App Setup'}
              {step === 'verify' && 'Enter Verification Code'}
            </CardTitle>
            <p className="text-purple-100 text-sm mt-1">
              {step === 'choose' && 'Add an extra layer of security to your account'}
              {step === 'totp' && 'Scan the QR code with your authenticator app'}
              {step === 'verify' && 'Enter the code sent to your email'}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Choose Method */}
            {step === 'choose' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-6 text-center">
                  {user.role === 'instructor' || user.role === 'admin' 
                    ? '2FA is required for instructor/admin accounts.'
                    : 'Protect your account with two-factor authentication.'}
                </p>
                
                <button
                  onClick={setupEmail2FA}
                  disabled={loading}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-slate-800">Email Verification</h3>
                    <p className="text-sm text-slate-500">Receive a code via email each time you log in</p>
                  </div>
                </button>
                
                <button
                  onClick={setupTOTP2FA}
                  disabled={loading}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-slate-800">Authenticator App</h3>
                    <p className="text-sm text-slate-500">Use Google Authenticator or similar apps</p>
                  </div>
                </button>
                
                {user.role !== 'instructor' && user.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    onClick={skipSetup}
                    className="w-full text-slate-500 hover:text-slate-700 mt-4"
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            )}
            
            {/* TOTP Setup with QR Code */}
            {step === 'totp' && qrCodeData && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="flex justify-center mb-4">
                    <img 
                      src={`data:image/png;base64,${qrCodeData}`} 
                      alt="QR Code for 2FA"
                      className="w-48 h-48 border-4 border-white shadow-lg rounded-lg"
                    />
                  </div>
                  
                  <div className="bg-slate-100 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Manual entry code:</p>
                    <code className="text-sm font-mono font-bold text-slate-800 select-all">{secretKey}</code>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totpCode">Enter the 6-digit code from your app</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                
                <Button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Verify & Enable 2FA</>
                  )}
                </Button>
              </div>
            )}
            
            {/* Email Verification */}
            {step === 'verify' && selectedMethod === 'email' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    We've sent a verification code to <strong>{user.email}</strong>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailCode">Enter verification code</Label>
                  <Input
                    id="emailCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-slate-500 text-center">
                    Code expires in 10 minutes
                  </p>
                </div>
                
                <Button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Verify & Enable 2FA</>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={setupEmail2FA}
                  disabled={loading}
                  className="w-full text-slate-500"
                >
                  Resend code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorSetup;

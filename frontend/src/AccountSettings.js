import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Shield, Mail, ArrowLeft, CheckCircle, Loader2, User, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('soul_food_user') || '{}'));
  const token = localStorage.getItem('soul_food_token');
  
  const [tfaStep, setTfaStep] = useState('idle'); // 'idle', 'sending', 'verify'
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/auth', { state: { returnTo: '/account-settings' } });
    }
  }, [token, navigate]);

  const startEmail2FA = async () => {
    setLoading(true);
    setTfaStep('sending');
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
      if (!response.ok) throw new Error(data.detail || 'Failed to send verification code');
      
      toast.success('Verification code sent to your email!');
      setTfaStep('verify');
    } catch (err) {
      toast.error(err.message);
      setTfaStep('idle');
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
      setUser(updatedUser);
      
      toast.success('2FA enabled! You will receive an email code on future logins.');
      setTfaStep('idle');
      setVerificationCode('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      <Toaster position="top-right" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/my-library')}
          className="mb-6 text-slate-600 hover:text-slate-800"
          data-testid="back-to-library-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Library
        </Button>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h1>
        
        {/* Profile Info */}
        <Card className="shadow-md mb-6" data-testid="profile-card">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-slate-600" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Name</span>
                <span className="font-medium text-slate-800">{user.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Email</span>
                <span className="font-medium text-slate-800">{user.email || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Role</span>
                <span className="font-medium text-slate-800 capitalize">{user.role || 'Member'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 2FA Security Section */}
        <Card className="shadow-md" data-testid="security-card">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-slate-600" />
              Security — Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {user.tfa_enabled ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200" data-testid="tfa-enabled-badge">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">2FA is enabled</p>
                  <p className="text-sm text-green-600">A verification code will be sent to your email when you log in.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-semibold text-amber-800">2FA is not enabled</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Add an extra layer of security. When enabled, you'll receive a 6-digit code via email each time you log in.
                  </p>
                </div>

                {tfaStep === 'idle' && (
                  <Button
                    onClick={startEmail2FA}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="enable-2fa-btn"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enable Email 2FA
                  </Button>
                )}

                {tfaStep === 'sending' && (
                  <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending verification code to {user.email}...
                  </div>
                )}

                {tfaStep === 'verify' && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <p className="text-sm text-purple-800">
                        Code sent to <strong>{user.email}</strong>. Check your inbox (and spam folder).
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tfaCode">Enter 6-digit code</Label>
                      <Input
                        id="tfaCode"
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-2xl tracking-widest font-mono"
                        data-testid="tfa-code-input"
                      />
                      <p className="text-xs text-slate-500">Code expires in 10 minutes</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={verifyCode}
                        disabled={loading || verificationCode.length !== 6}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        data-testid="verify-2fa-btn"
                      >
                        {loading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 mr-2" /> Verify & Enable</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={startEmail2FA}
                        disabled={loading}
                        data-testid="resend-code-btn"
                      >
                        Resend
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;

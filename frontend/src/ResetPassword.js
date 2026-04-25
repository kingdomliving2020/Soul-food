import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { safeJson } from './lib/safeFetch';
import { Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });
      
      const { ok, data } = await safeJson(res);
      
      if (!ok) {
        toast.error(data.detail || `Reset failed`);
        return;
      }
      
      // Auto-login if the server returned a token
      if (data.access_token) {
        localStorage.setItem('soul_food_token', data.access_token);
        localStorage.setItem('soul_food_user', JSON.stringify(data.user));
        localStorage.setItem('soul_food_session', JSON.stringify(data.session_config));
        window.dispatchEvent(new Event('auth-changed'));
        setSuccess(true);
        toast.success('Password reset! Logging you in...');
        setTimeout(() => {
          window.location.href = '/my-library';
        }, 1500);
      } else {
        setSuccess(true);
        toast.success('Password reset successfully!');
      }
    } catch (err) {
      toast.error(`Network error: ${err.message || 'Could not connect to server'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Reset Link</h2>
            <p className="text-slate-500 mb-4">This password reset link is invalid or has expired.</p>
            <Button onClick={() => navigate('/forgot-password')} className="bg-purple-600 hover:bg-purple-700">
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg py-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl" data-testid="reset-title">
              {success ? 'Password Updated!' : 'Set New Password'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {success ? (
              <div className="text-center space-y-4" data-testid="reset-success">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-slate-700">Your password has been reset successfully.</p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="goto-signin"
                >
                  Sign In with New Password
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    autoFocus
                    data-testid="new-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    data-testid="confirm-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="reset-password-btn"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

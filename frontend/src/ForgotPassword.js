import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      
      setSent(true);
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
          onClick={() => navigate('/auth')}
          className="mb-4 text-slate-600"
          data-testid="back-to-login"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
        </Button>
        
        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg py-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
              <Mail className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl" data-testid="forgot-title">
              {sent ? 'Check Your Email' : 'Reset Your Password'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {sent ? (
              <div className="text-center space-y-4" data-testid="reset-sent">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-slate-700">
                  If an account exists for <strong>{email}</strong>, we've sent a reset link.
                </p>
                <p className="text-sm text-slate-500">Check your inbox and spam folder. The link expires in 60 minutes.</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="w-full mt-4"
                  data-testid="return-signin"
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    data-testid="reset-email-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="send-reset-btn"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    'Send Reset Link'
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

export default ForgotPassword;

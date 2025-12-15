import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Eye, EyeOff, Mail, Lock, User, Gift, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testCodeValid, setTestCodeValid] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    testCode: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset test code validation when changed
    if (name === 'testCode') {
      setTestCodeValid(null);
    }
  };

  const validateTestCode = async () => {
    if (!formData.testCode.trim()) {
      setTestCodeValid(null);
      return;
    }
    
    try {
      const response = await fetch(`${API}/auth/validate-test-code/${encodeURIComponent(formData.testCode)}`);
      const data = await response.json();
      setTestCodeValid(data);
      
      if (data.valid) {
        toast.success(`Test code valid! You'll get ${data.access_level} access.`);
      } else {
        toast.error('Invalid test code');
      }
    } catch (err) {
      toast.error('Could not validate test code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            name: formData.name,
            test_code: formData.testCode || null
          };
      
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }
      
      // Store token and user info
      localStorage.setItem('soul_food_token', data.access_token);
      localStorage.setItem('soul_food_user', JSON.stringify(data.user));
      localStorage.setItem('soul_food_session', JSON.stringify(data.session_config));
      
      // Show success message
      toast.success(data.session_config.message || `Welcome${isLogin ? ' back' : ''}, ${data.user.name}!`);
      
      // Show session info for test users
      if (data.session_config.restrictions?.length > 0) {
        toast.info(`Session: ${data.session_config.timeout_mins} mins | ${data.user.role}`, {
          duration: 5000
        });
      }
      
      // Redirect
      setTimeout(() => {
        navigate(returnTo);
      }, 1000);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}${returnTo}`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <Card className="shadow-2xl border-2 border-orange-200">
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-3">
              <img 
                src="/soul-food-logo.png" 
                alt="Soul Food Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Welcome Back!' : 'Join Soul Food'}
            </CardTitle>
            <p className="text-orange-100 text-sm">
              {isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4" />
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="border-slate-300 focus:border-orange-500"
                  />
                </div>
              )}
              
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border-slate-300 focus:border-orange-500"
                />
              </div>
              
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-slate-700">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="border-slate-300 focus:border-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Test Code field (register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="testCode" className="flex items-center gap-2 text-slate-700">
                    <Gift className="w-4 h-4" />
                    Test/Beta Code (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="testCode"
                      name="testCode"
                      type="text"
                      placeholder="Enter test code if you have one"
                      value={formData.testCode}
                      onChange={handleInputChange}
                      className="border-slate-300 focus:border-orange-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateTestCode}
                      className="shrink-0"
                    >
                      Verify
                    </Button>
                  </div>
                  {testCodeValid && (
                    <div className={`text-sm p-2 rounded ${testCodeValid.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {testCodeValid.valid ? (
                        <>
                          ✓ {testCodeValid.description}
                          <Badge className="ml-2 bg-green-600">{testCodeValid.access_level}</Badge>
                        </>
                      ) : (
                        '✗ Invalid test code'
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Have a beta or tester code? Enter it to unlock special access.
                  </p>
                </div>
              )}
              
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or continue with</span>
              </div>
            </div>
            
            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
            
            {/* Toggle Login/Register */}
            <div className="text-center mt-6">
              <p className="text-slate-600 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setTestCodeValid(null);
                  }}
                  className="ml-2 text-orange-600 hover:text-orange-700 font-semibold"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
            
            {/* Guest Checkout Link */}
            {returnTo === '/checkout' && (
              <div className="text-center mt-4 pt-4 border-t border-slate-200">
                <p className="text-slate-500 text-sm">
                  Just want to checkout?
                  <button
                    type="button"
                    onClick={() => navigate('/checkout', { state: { guestCheckout: true } })}
                    className="ml-2 text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Continue as Guest
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Test Codes Info */}
        <Card className="mt-4 bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Testing the Site?
            </h4>
            <p className="text-sm text-purple-700 mb-2">
              Use these test codes to explore different access levels:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-purple-200">
                <code className="font-mono text-purple-600">test123</code>
                <p className="text-slate-600">Instructor Edition</p>
              </div>
              <div className="bg-white p-2 rounded border border-purple-200">
                <code className="font-mono text-purple-600">test1234</code>
                <p className="text-slate-600">Youth Edition</p>
              </div>
              <div className="bg-white p-2 rounded border border-purple-200">
                <code className="font-mono text-purple-600">test12345</code>
                <p className="text-slate-600">Adult Edition</p>
              </div>
              <div className="bg-white p-2 rounded border border-purple-200">
                <code className="font-mono text-purple-600">Beta1!2!3!</code>
                <p className="text-slate-600">Beta Tester</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;

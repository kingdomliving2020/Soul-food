import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowLeft, AtSign, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'beta'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [formData, setFormData] = useState({
    identifier: '', // email or username for login
    email: '',
    username: '',
    password: '',
    name: '',
    betaUsername: '',
    betaPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear password error when typing
    if (name === 'password') {
      setPasswordError('');
    }
  };

  // Validate password on blur (for registration)
  const validatePassword = () => {
    const password = formData.password;
    if (!password || authMode !== 'register') return;
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    let criteriaCount = 0;
    if (/[A-Z]/.test(password)) criteriaCount++;
    if (/[a-z]/.test(password)) criteriaCount++;
    if (/\d/.test(password)) criteriaCount++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) criteriaCount++;
    
    if (criteriaCount < 3) {
      setPasswordError('Password must include at least 3 of: uppercase, lowercase, number, special character');
      return;
    }
    
    setPasswordError('');
  };

  // Beta Login (username + password)
  const handleBetaLogin = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    if (!formData.betaUsername.trim() || !formData.betaPassword.trim()) {
      toast.error('Please enter username and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/auth/beta-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.betaUsername.trim(),
          password: formData.betaPassword
        })
      });
      
      // Handle the response - the emergent preview logger might consume the body for non-OK responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If body was already read (by emergent logger), check response status
        if (!response.ok) {
          // For 401 errors, provide a helpful message
          if (response.status === 401) {
            throw new Error('Invalid username or password. Please check your credentials.');
          }
          throw new Error(`Login failed (${response.status}). Please try again.`);
        }
        throw jsonError;
      }
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid credentials');
      }
      
      localStorage.setItem('soul_food_token', data.access_token);
      localStorage.setItem('soul_food_user', JSON.stringify(data.user));
      localStorage.setItem('soul_food_session', JSON.stringify(data.session_config));
      window.dispatchEvent(new Event('auth-changed'));
      
      toast.success(data.session_config.message);
      
      // Redirect beta users to my-library
      setTimeout(() => navigate('/my-library'), 1000);
      
    } catch (err) {
      console.error('Beta login error:', err);
      const errorMsg = err.message || 'Login failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Regular Login (email/username + password)
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: formData.identifier.trim(),
          password: formData.password
        })
      });
      
      // Handle the response - the emergent preview logger might consume the body for non-OK responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If body was already read, check response status
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid email/username or password.');
          } else if (response.status === 423) {
            throw new Error('Account is locked. Please try again later.');
          }
          throw new Error(`Login failed (${response.status}). Please try again.`);
        }
        throw jsonError;
      }
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid credentials');
      }
      
      localStorage.setItem('soul_food_token', data.access_token);
      localStorage.setItem('soul_food_user', JSON.stringify(data.user));
      localStorage.setItem('soul_food_session', JSON.stringify(data.session_config));
      window.dispatchEvent(new Event('auth-changed'));
      
      // Check for password expiry warnings
      if (data.password_expired) {
        toast.warning('Your password has expired. Please change it.');
        navigate('/change-password');
        return;
      }
      
      if (data.password_expiring_soon) {
        toast.info(`Your password expires in ${data.password_expires_in_days} days`);
      }
      
      // Check if 2FA setup is required (for instructors/admins)
      if (data.requires_2fa_setup) {
        toast.info(data.message || 'Please set up 2-factor authentication');
        setTimeout(() => navigate('/2fa-setup', { state: { returnTo } }), 1000);
        return;
      }
      
      // Check if 2FA verification is needed
      if (data.requires_2fa_verification) {
        toast.info(data.message || 'Please verify with your 2FA code');
        setTimeout(() => navigate('/2fa-verify', { state: { returnTo, userId: data.user.id } }), 1000);
        return;
      }
      
      toast.success(data.message || 'Welcome back!');
      
      // Redirect to My Library instead of home for logged in users
      setTimeout(() => navigate(returnTo === '/' ? '/my-library' : returnTo), 1000);
      
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.message || 'Login failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    // Validate password
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
          name: formData.name.trim()
        })
      });
      
      // Handle the response - the emergent preview logger might consume the body for non-OK responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If body was already read, check response status
        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Please check your registration details and try again.');
          } else if (response.status === 409) {
            throw new Error('Email or username already exists.');
          }
          throw new Error(`Registration failed (${response.status}). Please try again.`);
        }
        throw jsonError;
      }
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      localStorage.setItem('soul_food_token', data.access_token);
      localStorage.setItem('soul_food_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-changed'));
      
      toast.success(data.session_config?.message || `Welcome to Soul Food, ${data.user.name}!`);
      
      // Redirect to My Library for new users
      setTimeout(() => navigate('/my-library'), 1000);
      
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin;
    if (returnTo) {
      localStorage.setItem('auth_return_to', returnTo);
    }
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <Card className="shadow-2xl border-2 border-purple-200">
          <CardHeader className="text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-t-lg py-8">
            <div className="flex justify-center mb-4">
              <img src="/soul-food-logo.png" alt="Soul Food Logo" className="h-28 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {authMode === 'beta' ? 'Beta Access' : authMode === 'login' ? 'Welcome Back!' : 'Join Soul Food'}
            </CardTitle>
            <p className="text-purple-100 text-sm mt-1">
              {authMode === 'beta' ? 'Enter your beta credentials' : authMode === 'login' ? 'Sign in with email or username' : 'Create your account'}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Auth Mode Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  authMode === 'login' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  authMode === 'register' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setAuthMode('beta')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  authMode === 'beta' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3 h-3" />
                Beta
              </button>
            </div>

            {/* BETA LOGIN (username + password) */}
            {authMode === 'beta' && (
              <form onSubmit={handleBetaLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="betaUsername" className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4" />
                    Beta Username
                  </Label>
                  <Input
                    id="betaUsername"
                    name="betaUsername"
                    type="text"
                    placeholder="Enter beta username"
                    value={formData.betaUsername}
                    onChange={handleInputChange}
                    required
                    className="border-slate-300 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="betaPassword" className="flex items-center gap-2 text-slate-700">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="betaPassword"
                      name="betaPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={formData.betaPassword}
                      onChange={handleInputChange}
                      required
                      className="border-slate-300 focus:border-purple-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500">
                  Beta access for authorized testers only. Session time is limited.
                </p>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3"
                >
                  {loading ? 'Verifying...' : '⚡ Beta Login'}
                </Button>
              </form>
            )}

            {/* REGULAR LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="flex items-center gap-2 text-slate-700">
                    <AtSign className="w-4 h-4" />
                    Email or Username
                  </Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    placeholder="Enter email or username"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    required
                    className="border-slate-300 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loginPassword" className="flex items-center gap-2 text-slate-700">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="border-slate-300 focus:border-purple-500 pr-10"
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
                
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white font-bold py-3"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* REGISTRATION */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="border-slate-300 focus:border-purple-500"
                  />
                </div>
                
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
                    className="border-slate-300 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2 text-slate-700">
                    <AtSign className="w-4 h-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-zA-Z0-9_]+$"
                    className="border-slate-300 focus:border-purple-500"
                  />
                  <p className="text-xs text-slate-500">Letters, numbers, and underscores only</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regPassword" className="flex items-center gap-2 text-slate-700">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="regPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={validatePassword}
                      required
                      minLength={8}
                      className={`border-slate-300 focus:border-purple-500 pr-10 ${passwordError ? 'border-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {passwordError && (
                    <div className="flex items-start gap-2 text-red-600 text-xs">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Password must:</p>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                      <li>Be at least 8 characters</li>
                      <li>Include 3 of: uppercase, lowercase, number, special character</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading || !!passwordError}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white font-bold py-3"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            )}
            
            {/* Google Login - only for regular login/register */}
            {authMode !== 'beta' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;

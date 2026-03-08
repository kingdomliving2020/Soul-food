import React, { useState, useEffect } from 'react';
import { useCart, PRODUCTS } from './CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, ShoppingBag, Trash2, Mail, User, LogIn, UserPlus, ArrowRight, ShieldCheck, X, MapPin, Loader2, Gift, Package, Send, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Login Modal Component (Amazon/Walmart style)
const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpMethod, setOtpMethod] = useState('email'); // 'email', 'totp', 'sms'
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);

  // Age verification - must be 18+ for online transactions
  const validateAge = () => {
    if (!dobMonth || !dobDay || !dobYear) return false;
    const dob = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Use XMLHttpRequest to avoid Emergent script intercepting fetch
    const tryLogin = (url, body) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
            } catch (e) {
              reject(new Error('Invalid response'));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        xhr.send(JSON.stringify(body));
      });
    };

    try {
      // Try regular login
      let result = await tryLogin(
        `${BACKEND_URL}/api/auth/login`,
        { identifier: email, password }
      );

      if (result.ok && result.data.access_token) {
        // Check if 2FA is required
        if (result.data.requires_2fa_verification || result.data.requires_2fa_setup) {
          // Store pending auth data
          setPendingUserId(result.data.user?.id);
          setPendingToken(result.data.access_token);
          setPendingUserData(result.data.user);
          setMode('otp');
          
          // If user has TOTP set up, default to that
          if (result.data.user?.tfa_method === 'totp') {
            setOtpMethod('totp');
          } else {
            // Send email code automatically
            setOtpMethod('email');
            await sendOtpCode(result.data.access_token);
          }
          setLoading(false);
          return;
        }
        
        // No 2FA required - complete login
        localStorage.setItem('token', result.data.access_token);
        localStorage.setItem('soulFoodToken', result.data.access_token);
        localStorage.setItem('soul_food_token', result.data.access_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        localStorage.setItem('soul_food_user', JSON.stringify(result.data.user));
        onLoginSuccess(result.data.user);
      } else {
        // Show the actual error from the login attempt
        setError(result.data.detail || 'Invalid email/username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP code via email
  const sendOtpCode = async (token) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BACKEND_URL}/api/auth/2fa/send-code`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send();
    } catch (err) {
      console.error('Failed to send OTP:', err);
    }
  };

  // Verify OTP code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BACKEND_URL}/api/auth/2fa/verify`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (pendingToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${pendingToken}`);
      }
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          setLoading(false);
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.verified) {
              // OTP verified - complete login
              const finalToken = data.token || pendingToken;
              const finalUser = data.user || pendingUserData;
              
              localStorage.setItem('token', finalToken);
              localStorage.setItem('soulFoodToken', finalToken);
              localStorage.setItem('soul_food_token', finalToken);
              localStorage.setItem('user', JSON.stringify(finalUser));
              localStorage.setItem('soul_food_user', JSON.stringify(finalUser));
              onLoginSuccess(finalUser);
            } else {
              setError(data.detail || 'Invalid verification code');
            }
          } catch (e) {
            setError('Invalid response from server');
          }
        }
      };
      
      xhr.send(JSON.stringify({ 
        code: otpCode,
        user_id: pendingUserId
      }));
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BACKEND_URL}/api/auth/2fa/resend`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          setLoading(false);
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              setError('');
              alert('New code sent to your email!');
            } else {
              setError(data.detail || 'Failed to resend code');
            }
          } catch (e) {
            setError('Failed to resend code');
          }
        }
      };
      
      xhr.send(JSON.stringify({ user_id: pendingUserId }));
    } catch (err) {
      setLoading(false);
      setError('Connection error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      setLoading(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate age
    if (!validateAge()) {
      setError('You must be 18 years or older to make online purchases');
      setLoading(false);
      return;
    }

    // Build full name with suffix
    const fullName = suffix 
      ? `${firstName.trim()} ${lastName.trim()} ${suffix}`
      : `${firstName.trim()} ${lastName.trim()}`;

    // Generate username from email (part before @)
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    // Use XMLHttpRequest to avoid Emergent script intercepting fetch
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_URL}/api/auth/register`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        setLoading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300 && data.access_token) {
            // Save to all token keys for compatibility
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('soulFoodToken', data.access_token);
            localStorage.setItem('soul_food_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('soul_food_user', JSON.stringify(data.user));
            onLoginSuccess(data.user);
          } else {
            // Parse validation errors from backend
            if (data.detail && typeof data.detail === 'string') {
              setError(data.detail);
            } else if (data.detail && Array.isArray(data.detail)) {
              setError(data.detail.map(d => d.msg).join('. '));
            } else {
              setError('Registration failed. Please try again.');
            }
          }
        } catch (e) {
          setError('Invalid response from server');
        }
      }
    };
    
    xhr.onerror = function() {
      setLoading(false);
      setError('Connection error. Please try again.');
    };
    
    xhr.send(JSON.stringify({ 
      email, 
      username,
      password, 
      name: fullName,
      date_of_birth: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
    }));
  };

  if (!isOpen) return null;

  // OTP Verification Screen
  if (mode === 'otp') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <h2 className="text-xl font-bold text-white">Verify Your Identity</h2>
            <button
              onClick={() => { setMode('login'); setOtpCode(''); setError(''); }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* OTP Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setOtpMethod('email'); sendOtpCode(pendingToken); }}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    otpMethod === 'email' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📧 Email Code
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMethod('totp')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    otpMethod === 'totp' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  📱 Auth App
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {otpMethod === 'email' 
                ? 'Enter the 6-digit code sent to your email address.'
                : 'Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)'}
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-full px-4 py-4 text-2xl tracking-widest text-center font-mono border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Verify & Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {otpMethod === 'email' && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t text-center">
              <button
                onClick={() => { setMode('login'); setOtpCode(''); setError(''); }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Suffix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suffix (optional)</label>
                  <select
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    <option value="Jr.">Jr.</option>
                    <option value="Sr.">Sr.</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth * <span className="text-xs text-gray-500">(Must be 18+)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      required
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Month</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={String(i+1)}>{new Date(0, i).toLocaleString('en', {month: 'long'})}</option>
                      ))}
                    </select>
                    <select
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      required
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Day</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i+1} value={String(i+1)}>{i+1}</option>
                      ))}
                    </select>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      required
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Year</option>
                      {[...Array(100)].map((_, i) => {
                        const year = new Date().getFullYear() - 18 - i;
                        return <option key={year} value={String(year)}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'login' ? 'Email or Username' : 'Email *'}
              </label>
              <input
                type={mode === 'register' ? 'email' : 'text'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={mode === 'login' ? 'you@example.com or username' : 'you@example.com'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Min 8 characters"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Re-enter password"
                />
              </div>
            )}

            {mode === 'register' && (
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy. 
                You must be 18 years or older to make online purchases.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 pt-6 border-t text-center">
            {mode === 'login' ? (
              <p className="text-gray-600">
                New customer?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Order Notes
  const [orderNotes, setOrderNotes] = useState('');
  
  // Customer info for email delivery
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Amazon-like checkout flow state
  const [checkoutStep, setCheckoutStep] = useState('guest-prompt'); // 'guest-prompt', 'checkout'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Customer phone for audio code tracking
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Shipping address for physical items
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  
  // Gift options
  const [isGift, setIsGift] = useState(false);
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [giftOptions, setGiftOptions] = useState({
    recipientName: '',
    recipientEmail: '',
    giftMessage: '',
    includeGiftReceipt: false,
    sendDigitalGift: false
  });
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  
  // Check if cart has digital-only items (for digital gift option)
  const hasDigitalItems = cartItems.some(item => {
    const medium = item.metadata?.medium || '';
    return medium === 'digital' || medium === 'pdf' || 
           item.name?.toLowerCase().includes('digital') ||
           item.name?.toLowerCase().includes('pdf');
  });
  
  const subtotal = getCartTotal();
  // Handle both percentage and fixed dollar discounts (gift certificates)
  const discount = couponApplied 
    ? (couponApplied.is_gift_certificate && couponApplied.discount_dollars > 0
        ? Math.min(subtotal, couponApplied.discount_dollars)  // Gift cert: use dollar amount, cap at subtotal
        : (subtotal * couponApplied.discount_percent / 100))  // Regular coupon: use percentage
    : 0;
  const total = subtotal - discount;
  
  // Check if cart has physical items that need shipping
  const hasPhysicalItems = cartItems.some(item => {
    const medium = item.metadata?.medium || '';
    return medium === 'paperback' || medium === 'physical' || 
           item.name?.toLowerCase().includes('print') ||
           item.name?.toLowerCase().includes('paperback');
  });
  // Minimum order for coupon discount
  const COUPON_MINIMUM = 7.00;

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
        setCustomerEmail(userData.email || '');
        setCustomerName(userData.name || userData.full_name || '');
        setCheckoutStep('checkout'); // Skip guest prompt if logged in
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Check if returning from login
    const params = new URLSearchParams(location.search);
    if (params.get('returning') === 'true') {
      setCheckoutStep('checkout');
    }
  }, [location]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    // Check minimum order requirement
    if (subtotal < COUPON_MINIMUM) {
      setCouponError(`Coupons require a minimum order of $${COUPON_MINIMUM.toFixed(2)}`);
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      // Get product IDs - use uniqueKey or productId, filter out any undefined
      const productIds = cartItems
        .map(item => item.uniqueKey || item.productId || item.id)
        .filter(id => id !== undefined);
      
      const response = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          product_ids: productIds,
          cart_total: subtotal
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setCouponApplied({
          code: couponCode.toUpperCase(),
          discount_percent: data.discount_percent,
          discount_dollars: data.discount_dollars || 0,
          is_gift_certificate: data.is_gift_certificate || false,
          message: data.message
        });
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        setCouponApplied(null);
      }
    } catch (error) {
      setCouponError('Error validating coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    // Validate email is provided
    if (!customerEmail.trim()) {
      setError('Please enter your email address to receive order confirmation.');
      setLoading(false);
      return;
    }
    
    // Validate shipping address for physical items
    if (hasPhysicalItems) {
      if (!shippingAddress.street.trim() || !shippingAddress.city.trim() || 
          !shippingAddress.state.trim() || !shippingAddress.zipCode.trim()) {
        setError('Please enter your complete shipping address for physical items.');
        setLoading(false);
        return;
      }
    }

    try {
      // Calculate total with discount (handle both percentage and dollar amounts)
      let totalAmount = subtotal;
      if (couponApplied) {
        if (couponApplied.is_gift_certificate && couponApplied.discount_dollars > 0) {
          // Gift certificate: fixed dollar discount
          totalAmount = Math.max(0, totalAmount - couponApplied.discount_dollars);
        } else {
          // Regular coupon: percentage discount
          totalAmount = totalAmount - (totalAmount * couponApplied.discount_percent / 100);
        }
      }
      
      // If total is $0 (100% discount or gift cert covers full amount), bypass Stripe and go directly to success
      if (totalAmount <= 0 && couponApplied) {
        // Record the free order with customer email for confirmation
        const orderResponse = await fetch(`${BACKEND_URL}/api/payments/free-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems.map(item => ({
              product_id: item.productId || item.uniqueKey || item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.salePrice
            })),
            coupon_code: couponApplied.code,
            discount_percent: couponApplied.discount_percent || 100,
            discount_dollars: couponApplied.discount_dollars || 0,
            customer_email: customerEmail || null,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            shipping_address: hasPhysicalItems ? shippingAddress : null
          }),
        });

        if (orderResponse.ok) {
          // Handle case where body may already be consumed by interceptor
          let orderData;
          if (orderResponse.bodyUsed) {
            // Generate order ID locally if response was consumed
            orderData = { order_id: `FREE-${Date.now().toString(36).toUpperCase()}`, download_links: [] };
          } else {
            orderData = await orderResponse.json();
          }
          
          // Store order info including download links and redirect to success/download page
          sessionStorage.setItem('orderComplete', JSON.stringify({
            orderId: orderData.order_id,
            items: cartItems,
            coupon: couponApplied,
            downloadLinks: orderData.download_links || [],
            customerEmail: customerEmail
          }));
          clearCart();
          navigate('/order-success?free=true&order=' + orderData.order_id);
        } else {
          // Handle error response with bodyUsed check
          if (!orderResponse.bodyUsed) {
            const errorData = await orderResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to process free order');
          } else {
            throw new Error('Failed to process free order. Please try again.');
          }
        }
        return;
      }

      const headers = {
          'Content-Type': 'application/json',
        };
      
      // Add auth token if user is logged in
      const token = localStorage.getItem('soulFoodToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/payments/checkout/cart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product_id: item.productId || item.uniqueKey || item.id,
            name: item.name,
            quantity: item.quantity,
            salePrice: item.salePrice
          })),
          origin_url: window.location.origin,
          coupon_code: couponApplied?.code || null,
          discount_percent: couponApplied?.discount_percent || 0,
          is_gift: isGift,
          order_notes: orderNotes,
          customer_email: customerEmail || null,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          shipping_address: hasPhysicalItems ? shippingAddress : null
        }),
      });

      // Handle response - check if body was already consumed
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Body might already be read by an interceptor
        console.warn('Response body already read, checking response status');
        if (!response.ok) {
          throw new Error('Checkout failed. Please try again.');
        }
        // If response was OK but body consumed, something went wrong
        throw new Error('Unexpected error during checkout. Please try again.');
      }

      // Check for account required error (401)
      if (!response.ok && data.detail?.error === 'account_required') {
        setError(`${data.detail.message}\n\nItems requiring account: ${data.detail.items_requiring_account?.join(', ')}`);
        setShowLoginModal(true);
        setLoading(false);
        return;
      }

      if (data.checkout_url || data.url) {
        // Clear cart before redirect
        clearCart();
        window.location.href = data.checkout_url || data.url;
      } else if (data.detail?.error === 'account_required') {
        // Handle account required error - show login modal
        setError(`${data.detail.message}\n\nItems requiring account: ${data.detail.items_requiring_account?.join(', ')}`);
        setShowLoginModal(true);
      } else {
        const errorMsg = typeof data.detail === 'object' ? data.detail.message || JSON.stringify(data.detail) : data.detail;
        throw new Error(errorMsg || 'Failed to create checkout session');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    // Show login modal instead of navigating away (Amazon/Walmart style)
    setShowLoginModal(true);
  };
  
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setCustomerEmail(userData.email || '');
    setCustomerName(userData.name || userData.full_name || '');
    setShowLoginModal(false);
    setCheckoutStep('checkout');
  };

  const handleContinueAsGuest = () => {
    setCheckoutStep('checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to get started!</p>
          <button
            onClick={() => navigate('/quick-order')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // === AMAZON-LIKE GUEST/SIGN-IN PROMPT ===
  if (checkoutStep === 'guest-prompt') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
        
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">How would you like to continue?</p>
          </div>

          {/* Order Summary Mini */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{cartItems.length} item{cartItems.length > 1 ? 's' : ''} in cart</span>
              <span className="font-bold text-lg">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Check for items requiring account */}
          {(() => {
            const accountRequiredKeywords = ['gaming-pass', 'subscription', 'instructor', 'bundle', '-ie-'];
            const itemsRequiringAccount = cartItems.filter(item => {
              const itemId = (item.productId || item.id || '').toLowerCase();
              const itemName = (item.name || '').toLowerCase();
              return accountRequiredKeywords.some(kw => itemId.includes(kw) || itemName.includes(kw));
            });
            
            if (itemsRequiringAccount.length > 0) {
              return (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-amber-800 mb-1">Account Required for Some Items</h3>
                      <p className="text-amber-700 text-sm mb-2">
                        The following items require an account for license management:
                      </p>
                      <ul className="text-amber-700 text-sm list-disc list-inside mb-3">
                        {itemsRequiringAccount.map((item, idx) => (
                          <li key={idx}>{item.name}</li>
                        ))}
                      </ul>
                      <button
                        onClick={handleSignIn}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Sign In to Continue
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Sign In Option */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-4">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Sign In</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Access your order history, saved addresses, and get personalized recommendations.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1 mb-4">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Track your orders
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Access download history
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Faster checkout next time
                    </li>
                  </ul>
                  <button
                    onClick={handleSignIn}
                    data-testid="checkout-sign-in-btn"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm font-medium">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Guest Checkout Option */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Continue as Guest</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    No account needed. Just enter your email to receive order confirmation and download links.
                  </p>
                  <button
                    onClick={handleContinueAsGuest}
                    data-testid="checkout-guest-btn"
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Continue as Guest
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Secure checkout powered by Stripe
            </p>
          </div>

          {/* Back to Cart Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/quick-order')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← Back to shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === MAIN CHECKOUT FORM ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 py-12 px-4">
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>
        
        {/* Logged in user badge */}
        {isLoggedIn && user && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-800">
                Signed in as <strong>{user.email}</strong>
              </p>
            </div>
            <button
              onClick={() => setCheckoutStep('guest-prompt')}
              className="text-xs text-green-600 hover:text-green-700"
            >
              Change
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Your Items
            </h2>
            
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.seriesName && `${item.seriesName} • `}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-600">
                      ${(item.salePrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.uniqueKey || item.productId)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Order Summary
            </h2>

            {/* Coupon Code Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border border-purple-100">
              <label className="block text-sm font-semibold text-purple-700 mb-2">
                Have a coupon or gift certificate?
              </label>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-100 p-3 rounded-lg">
                  <div>
                    <span className="font-bold text-green-700">{couponApplied.code}</span>
                    <span className="text-green-600 ml-2">
                      {couponApplied.is_gift_certificate 
                        ? `($${couponApplied.discount_dollars?.toFixed(2)} off)`
                        : `(${couponApplied.discount_percent}% off)`
                      }
                    </span>
                    {couponApplied.is_gift_certificate && (
                      <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">🎁 Gift Certificate</span>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon or gift certificate code"
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    disabled={subtotal < COUPON_MINIMUM}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || subtotal < COUPON_MINIMUM}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-red-500 text-xs mt-2">{couponError}</p>
              )}
              {subtotal < COUPON_MINIMUM && !couponApplied && (
                <p className="text-amber-600 text-xs mt-2">💡 Coupons require minimum order of ${COUPON_MINIMUM.toFixed(2)}</p>
              )}
            </div>
            
            {/* Customer Email for Order Confirmation */}
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-800">Order Confirmation</span>
              </div>
              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoggedIn}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoggedIn}
                  />
                </div>
                {hasPhysicalItems && (
                  <div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number (for shipping updates)"
                      className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-indigo-500 mt-1">Used for shipping notifications & audio code generation</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                📧 We'll send your order confirmation and download links to this email.
              </p>
            </div>
            
            {/* Gift Options */}
            <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="w-5 h-5 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                />
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-600" />
                  <span className="font-semibold text-pink-800">This is a gift</span>
                </div>
              </label>
              
              {isGift && (
                <div className="mt-4 space-y-4 pl-8">
                  {/* Recipient Name */}
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">Recipient's Name</label>
                    <input
                      type="text"
                      value={giftOptions.recipientName}
                      onChange={(e) => setGiftOptions({...giftOptions, recipientName: e.target.value})}
                      placeholder="Who is this gift for?"
                      className="w-full px-3 py-2.5 text-sm border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  
                  {/* Gift Receipt Option */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftOptions.includeGiftReceipt}
                      onChange={(e) => setGiftOptions({...giftOptions, includeGiftReceipt: e.target.checked})}
                      className="w-4 h-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm text-pink-700">Include gift receipt (prices hidden)</span>
                  </label>
                  
                  {/* Digital Gift Option */}
                  {hasDigitalItems && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={giftOptions.sendDigitalGift}
                        onChange={(e) => setGiftOptions({...giftOptions, sendDigitalGift: e.target.checked})}
                        className="w-4 h-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                      />
                      <div className="flex items-center gap-1">
                        <Send className="w-4 h-4 text-pink-600" />
                        <span className="text-sm text-pink-700">Send digital items as gift card via email</span>
                      </div>
                    </label>
                  )}
                  
                  {giftOptions.sendDigitalGift && (
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">Recipient's Email</label>
                      <input
                        type="email"
                        value={giftOptions.recipientEmail}
                        onChange={(e) => setGiftOptions({...giftOptions, recipientEmail: e.target.value})}
                        placeholder="recipient@email.com"
                        className="w-full px-3 py-2.5 text-sm border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  )}
                  
                  {/* Gift Message */}
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">Gift Message (optional)</label>
                    <textarea
                      value={giftOptions.giftMessage}
                      onChange={(e) => setGiftOptions({...giftOptions, giftMessage: e.target.value})}
                      placeholder="Add a personal message..."
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 py-2.5 text-sm border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                    <p className="text-xs text-pink-500 mt-1">{giftOptions.giftMessage.length}/200 characters</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Shipping Address for Physical Items */}
            {hasPhysicalItems && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                {/* Audio Bonus Note */}
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🎧</span>
                    <div>
                      <p className="text-sm font-semibold text-purple-800">Bonus: Free Audio Access!</p>
                      <p className="text-xs text-purple-600">Your physical book purchase includes a free audio access code. You'll receive it in your order confirmation email.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Billing Address</span>
                </div>
                
                {/* Billing Address Fields */}
                <div className="space-y-3 mb-4">
                  <div>
                    <input
                      type="text"
                      value={billingAddress.street}
                      onChange={(e) => {
                        setBillingAddress({...billingAddress, street: e.target.value});
                        if (sameAsBilling) setShippingAddress({...shippingAddress, street: e.target.value});
                      }}
                      placeholder="Street address"
                      required
                      className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={billingAddress.city}
                      onChange={(e) => {
                        setBillingAddress({...billingAddress, city: e.target.value});
                        if (sameAsBilling) setShippingAddress({...shippingAddress, city: e.target.value});
                      }}
                      placeholder="City"
                      required
                      className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="text"
                      value={billingAddress.state}
                      onChange={(e) => {
                        setBillingAddress({...billingAddress, state: e.target.value});
                        if (sameAsBilling) setShippingAddress({...shippingAddress, state: e.target.value});
                      }}
                      placeholder="State"
                      required
                      className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={billingAddress.zipCode}
                      onChange={(e) => {
                        setBillingAddress({...billingAddress, zipCode: e.target.value});
                        if (sameAsBilling) setShippingAddress({...shippingAddress, zipCode: e.target.value});
                      }}
                      placeholder="ZIP Code"
                      required
                      className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="text"
                      value={billingAddress.country}
                      onChange={(e) => {
                        setBillingAddress({...billingAddress, country: e.target.value});
                        if (sameAsBilling) setShippingAddress({...shippingAddress, country: e.target.value});
                      }}
                      placeholder="Country"
                      className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                
                {/* Ship to Different Address Option */}
                <div className="border-t border-amber-200 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={!sameAsBilling}
                      onChange={(e) => {
                        setSameAsBilling(!e.target.checked);
                        setShipToDifferentAddress(e.target.checked);
                        if (!e.target.checked) {
                          // Copy billing to shipping
                          setShippingAddress({...billingAddress});
                        }
                      }}
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">Ship to a different address</span>
                    </div>
                  </label>
                  
                  {/* Different Shipping Address Fields */}
                  {shipToDifferentAddress && (
                    <div className="space-y-3 mt-3 p-3 bg-amber-100/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-amber-700" />
                        <span className="text-sm font-semibold text-amber-800">Shipping Address</span>
                        {isGift && <span className="text-xs bg-pink-200 text-pink-800 px-2 py-0.5 rounded">🎁 Gift Recipient</span>}
                      </div>
                      
                      {isGift && giftOptions.recipientName && (
                        <div>
                          <input
                            type="text"
                            value={giftOptions.recipientName}
                            disabled
                            className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg bg-amber-50 text-amber-800"
                          />
                          <p className="text-xs text-amber-600 mt-1">Recipient name from gift options</p>
                        </div>
                      )}
                      
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        placeholder="Street address"
                        required
                        className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          placeholder="City"
                          required
                          className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                          placeholder="State"
                          required
                          className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={shippingAddress.zipCode}
                          onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                          placeholder="ZIP Code"
                          required
                          className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <input
                          type="text"
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                          placeholder="Country"
                          className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Order Notes */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Order Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Color preferences, gift message, special instructions..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{orderNotes.length}/500</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount ({couponApplied.discount_percent}%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="text-purple-600">${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-800 mb-1">Account Required</h4>
                    <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="mt-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      Sign In or Create Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email Required Warning */}
            {!customerEmail && !isLoggedIn && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Please enter your email to receive order confirmation and download links.</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || (!customerEmail && !isLoggedIn)}
              data-testid="checkout-submit-btn"
              className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                'Processing...'
              ) : total <= 0 ? (
                <>
                  Complete Free Order
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Proceed to Payment - ${total.toFixed(2)}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

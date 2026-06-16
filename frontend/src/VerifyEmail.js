import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('failed');
      setMessage('No verification token provided.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/verify-email/${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setStatus('success');
          setEmail(data.email || '');
          setMessage(data.message || 'Email verified.');
        } else {
          setStatus('failed');
          setMessage(data.detail || data.message || 'Verification failed.');
        }
      } catch (e) {
        setStatus('failed');
        setMessage(`Network error: ${e.message}`);
      }
    })();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json().catch(() => ({}));
      setResendMsg(data.message || (res.ok ? 'Verification email sent.' : 'Could not send email.'));
    } catch (e) {
      setResendMsg(`Network error: ${e.message}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-indigo-100 p-8" data-testid="verify-email-card">
        {status === 'verifying' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h1>
            <p className="text-sm text-gray-600">Hang tight — this only takes a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center" data-testid="verify-success">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified</h1>
            {email && <p className="text-sm text-gray-600 mb-1"><strong>{email}</strong></p>}
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              data-testid="verify-back-to-shop"
              className="w-full px-5 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-sm transition-colors"
            >
              Continue to Soul Food
            </button>
            <button
              onClick={() => navigate('/my-library')}
              data-testid="verify-to-library"
              className="w-full mt-2 px-5 py-3 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-lg transition-colors"
            >
              Go to My Library
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center" data-testid="verify-failed">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-sm text-gray-600 mb-6">{message}</p>

            <form onSubmit={handleResend} className="text-left">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Resend verification email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="verify-resend-email-input"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={resending}
                  data-testid="verify-resend-btn"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-400 text-white font-semibold rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  {resending ? 'Sending…' : 'Resend'}
                </button>
              </div>
              {resendMsg && (
                <p className="mt-2 text-xs text-gray-600" data-testid="verify-resend-message">{resendMsg}</p>
              )}
            </form>

            <button
              onClick={() => navigate('/auth')}
              className="w-full mt-6 px-5 py-3 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

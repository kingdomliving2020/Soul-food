import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, FileText, BookOpen, ArrowRight, AlertCircle, Loader2, Mail, Gift } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [downloading, setDownloading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFreeOrder = searchParams.get('free') === 'true';
  const orderId = searchParams.get('order');

  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);

  const handleResendAccess = async () => {
    if (!orderId || !resendEmail.trim()) return;
    setResending(true);
    setResendResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/resend-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderId, email: resendEmail.trim() }),
      });
      
      // Handle response - body may already be consumed by global interceptor
      let data = {};
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseErr) {
        // Body already consumed or parse failed - use status code for message
        if (res.status === 429) {
          data = { detail: 'Too many requests. Please wait an hour before trying again.' };
        } else if (res.status === 403) {
          data = { detail: 'Email does not match the order. Use the email from your receipt.' };
        } else if (res.status === 404) {
          data = { detail: 'Order not found. Check your order number.' };
        } else if (res.ok) {
          data = { success: true, message: 'Access email sent! Check your inbox.' };
        } else {
          data = { detail: 'Request failed. Please try again.' };
        }
      }
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to resend');
      }
      setResendResult({ success: true, message: data.message || 'Access email sent! Check your inbox.' });
    } catch (err) {
      setResendResult({ success: false, message: err.message });
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const loadOrderData = async () => {
      setLoading(true);
      setError(null);
      
      // First try to get order data from session storage
      const storedOrder = sessionStorage.getItem('orderComplete');
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder);
        setOrderData(parsed);
        
        // If we have download links from the free order response, we're good
        if (parsed.downloadLinks && parsed.downloadLinks.length > 0) {
          setLoading(false);
          return;
        }
      }
      
      // If no stored data or no download links, fetch from backend
      if (orderId) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/payments/order/${orderId}`);
          if (response.ok) {
            const data = await response.json();
            setOrderData(prev => ({
              ...prev,
              orderId: data.order_id,
              items: data.items || prev?.items || [],
              downloadLinks: data.download_links || [],
              paymentStatus: data.payment_status,
              orderType: data.order_type
            }));
          } else {
          }
        } catch (err) {
          console.error('Error fetching order:', err);
        }
      }
      
      setLoading(false);
    };
    
    loadOrderData();
  }, [orderId, isFreeOrder]);

  const handleDownload = async (item, downloadLink) => {
    const itemKey = downloadLink?.product_id || item?.name;
    setDownloading(prev => ({ ...prev, [itemKey]: true }));
    
    try {
      // If we have a download token from the backend, use the secure download endpoint
      if (downloadLink?.token) {
        const response = await fetch(`${BACKEND_URL}/api/downloads/file/${downloadLink.token}`);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Download failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SoulFood_${downloadLink.product_name || 'content'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
      
      // Fallback: try to determine download from item name
      const seriesMatch = item?.name?.match(/Holiday|Break\*?fast|Lunch/i);
      const editionMatch = item?.name?.match(/ADULT|YOUTH|INSTRUCTOR/i);
      
      let series = seriesMatch ? seriesMatch[0].toLowerCase().replace('*', '') : 'holiday';
      const edition = editionMatch ? editionMatch[0].toLowerCase() : 'adult';
      
      // Determine lesson ID based on lesson name in item
      let lessonId = 'covenant'; // default
      if (item?.name?.includes('Covenant')) lessonId = 'covenant';
      else if (item?.name?.includes('Cradle')) lessonId = 'cradle';
      else if (item?.name?.includes('Cross')) lessonId = 'cross';
      else if (item?.name?.includes('Comforter')) lessonId = 'comforter';
      else if (item?.name?.includes('Made in His Image')) lessonId = 'in-his-image-1';
      else if (item?.name?.includes('Accepted and Loved')) lessonId = 'in-his-image-2';
      else if (item?.name?.includes('Chosen of God')) lessonId = 'in-his-image-3';
      
      // Map to correct nibble ID format
      const editionCode = edition === 'adult' ? 'ae' : edition === 'youth' ? 'ye' : 'ie';
      const nibbleId = `${series}-${editionCode}-${lessonId}`;
      
      
      // Call the PDF download endpoint
      const response = await fetch(`${BACKEND_URL}/api/interactive-lessons/download/nibble/${nibbleId}`);
      
      if (!response.ok) {
        // Try alternative download method - series download
        const seriesResponse = await fetch(`${BACKEND_URL}/api/interactive-lessons/download/series/${series}`);
        if (!seriesResponse.ok) {
          throw new Error('Failed to download');
        }
        const blob = await seriesResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SoulFood_${series}_series.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
      
      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoulFood_${series}_${lessonId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(error.message || 'Download is being prepared. Please try again in a moment or visit the Interactive Lessons page.');
    } finally {
      setDownloading(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleViewInteractive = (item) => {
    // Navigate to the interactive lesson page using nibble ID
    const editionMatch = item.name?.match(/ADULT|YOUTH|INSTRUCTOR/i);
    const edition = editionMatch ? editionMatch[0].toLowerCase() : 'adult';
    const editionCode = edition === 'adult' ? 'ae' : edition === 'youth' ? 'ye' : 'ie';
    
    // Determine nibble ID based on lesson name
    let nibbleId = 'holiday-ae-covenant'; // default
    
    if (item.name?.includes('Covenant')) nibbleId = `holiday-${editionCode}-covenant`;
    else if (item.name?.includes('Cradle')) nibbleId = `holiday-${editionCode}-cradle`;
    else if (item.name?.includes('Cross')) nibbleId = `holiday-${editionCode}-cross`;
    else if (item.name?.includes('Comforter')) nibbleId = `holiday-${editionCode}-comforter`;
    else if (item.name?.includes('Made in His Image')) nibbleId = 'in-his-image-1';
    else if (item.name?.includes('Accepted and Loved')) nibbleId = 'in-his-image-2';
    else if (item.name?.includes('Chosen of God')) nibbleId = 'in-his-image-3';
    else if (item.name?.includes('Names of God')) nibbleId = `holiday-${editionCode}-bonus-names`;
    else if (item.name?.includes('Times and Seasons')) nibbleId = `holiday-${editionCode}-bonus-times`;
    
    // Navigate to the interactive lesson route
    navigate(`/interactive-lesson/${nibbleId}`);
  };

  // Find matching download link for an item
  const getDownloadLinkForItem = (item) => {
    if (!orderData?.downloadLinks) return null;
    
    const itemProductId = item.productId || item.product_id || item.uniqueKey || item.id;
    return orderData.downloadLinks.find(link => 
      link.product_id === itemProductId || 
      link.product_name?.toLowerCase().includes(item.name?.toLowerCase()?.substring(0, 10))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8" data-testid="order-success-header">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Complete!</h1>
          <p className="text-gray-600">
            {isFreeOrder 
              ? "Your beta access has been activated. Enjoy your free lessons!"
              : "Thank you for your purchase!"}
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mt-2">Order ID: {orderId}</p>
          )}
        </div>

        {/* Access Your Content - Primary CTA */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 mb-6 text-white" data-testid="access-content-section">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Access Your Content
          </h2>
          <p className="text-green-100 text-sm mb-4">Your digital content is ready. Download now or access anytime from your library.</p>
        </div>

        {/* Download Links Section - Primary for Free Orders */}
        {orderData?.downloadLinks && orderData.downloadLinks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              Your Downloads Are Ready!
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Click each download button to save your files. Downloads are limited to 3 per file.
            </p>
            
            {orderData.downloadLinks.map((link, index) => (
              <div key={link.token || link.product_id || `dl-${index}`} className="border-b last:border-b-0 py-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{link.product_name}</h3>
                    <p className="text-sm text-gray-500">
                      {link.remaining !== undefined 
                        ? `${link.max_downloads - link.download_count} of ${link.max_downloads} downloads remaining`
                        : `Expires: ${new Date(link.expires_at).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  {isFreeOrder && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      FREE (Beta)
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleDownload(null, link)}
                  disabled={downloading[link.product_id]}
                  data-testid={`download-btn-${link.product_id}`}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {downloading[link.product_id] ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Order Items with Downloads (Fallback) */}
        {orderData?.items?.length > 0 && (!orderData?.downloadLinks || orderData.downloadLinks.length === 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-600" />
              Your Downloads
            </h2>
            
            {orderData.items.map((item, index) => {
              const downloadLink = getDownloadLinkForItem(item);
              const seriesMatch = item.name?.match(/Holiday|Break\*?fast|Lunch/i);
              const lessonMatch = item.name?.match(/Covenant|Cradle|Cross|Comforter|Made in His Image|Accepted and Loved|Chosen of God/i);
              const series = seriesMatch ? seriesMatch[0].replace('*', '') : 'Holiday';
              const lesson = lessonMatch ? lessonMatch[0] : 'Lesson';
              
              return (
                <div key={item.product_id || item.id || `item-${index}`} className="border-b last:border-b-0 py-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name || `${series} Series - ${lesson}`}</h3>
                      <p className="text-sm text-gray-500">
                        {series} Series • {lesson} • Qty: {item.quantity || 1}
                      </p>
                    </div>
                    {isFreeOrder && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                        FREE (Beta)
                      </span>
                    )}
                  </div>
                  
                  {/* Download Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDownload(item, downloadLink)}
                      disabled={downloading[item.name]}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      {downloading[item.name] ? 'Downloading...' : 'Download PDF'}
                    </button>
                    
                    <button
                      onClick={() => handleViewInteractive(item)}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Open Interactive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Items Found */}
        {(!orderData?.items?.length && !orderData?.downloadLinks?.length) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No downloads found</h3>
              <p className="text-gray-500 mb-4">
                If you just completed a purchase, your downloads may still be processing.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Refresh Page →
              </button>
            </div>
          </div>
        )}

        {/* Create Account to Save Library (for guests) */}
        {!localStorage.getItem('soul_food_token') && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200" data-testid="create-account-prompt">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg mb-1">Create Account to Save Your Library</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Save your purchases, track downloads, earn rewards points, and get instant access to future orders.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/auth', { state: { returnTo: '/my-library', mode: 'register' } })}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    data-testid="create-account-btn"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Create Free Account
                  </button>
                  <button
                    onClick={() => navigate('/auth', { state: { returnTo: '/my-library' } })}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resend Access Link + Redeem Code */}
        {orderId && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6" data-testid="resend-access-section">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Resend Access Link
            </h2>
            <p className="text-sm text-gray-500 mb-4">Didn't get the email? Enter your email to resend download &amp; redeem links.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={resendEmail}
                onChange={e => { setResendEmail(e.target.value); setResendResult(null); }}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                data-testid="resend-email-input"
              />
              <button
                onClick={handleResendAccess}
                disabled={resending || !resendEmail.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                data-testid="resend-access-btn"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </div>
            {resendResult && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${resendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`} data-testid="resend-result">
                {resendResult.message}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <Gift className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-sm text-gray-800">Have an account? <strong>Redeem this order</strong> to save it to your library permanently.</p>
              </div>
              <button
                onClick={() => navigate(`/redeem?code=${orderId}`)}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                data-testid="redeem-from-success-btn"
              >
                Redeem Now &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-3">What's Next?</h2>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Download your PDF lessons for offline study
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Use the Interactive mode for guided learning
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Try our Scripture Games to reinforce your learning!
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/my-library')}
              data-testid="go-to-library-btn"
              className="bg-white text-purple-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go to My Library
            </button>
            <button
              onClick={() => navigate('/')}
              data-testid="return-home-btn"
              className="bg-white/20 text-white font-semibold py-2 px-6 rounded-lg hover:bg-white/30 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>

        {/* Guest Order Notice */}
        {isFreeOrder && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>📋 Important:</strong> As a guest, please download your files now. 
              Bookmark this page or save your Order ID ({orderId}) to access downloads later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;

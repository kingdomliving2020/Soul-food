import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, FileText, BookOpen, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [downloading, setDownloading] = useState({});

  const isFreeOrder = searchParams.get('free') === 'true';
  const orderId = searchParams.get('order');

  useEffect(() => {
    // Get order data from session storage
    const storedOrder = sessionStorage.getItem('orderComplete');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
    }
  }, []);

  const handleDownload = async (item, format = 'pdf') => {
    setDownloading(prev => ({ ...prev, [item.name]: true }));
    
    try {
      // Extract series and lesson info from the item name
      const seriesMatch = item.name.match(/Holiday|Breakfast|Lunch/i);
      const lessonMatch = item.name.match(/Covenant|Cradle|Cross|Comforter/i);
      const editionMatch = item.name.match(/ADULT|YOUTH|INSTRUCTOR/i);
      
      const series = seriesMatch ? seriesMatch[0].toLowerCase() : 'holiday';
      const lesson = lessonMatch ? lessonMatch[0].toLowerCase() : 'covenant';
      const edition = editionMatch ? editionMatch[0].toLowerCase() : 'adult';
      
      // Map to correct nibble ID format: holiday-ae-covenant, holiday-ae-cradle, etc.
      const editionCode = edition === 'adult' ? 'ae' : edition === 'youth' ? 'ye' : 'ie';
      const nibbleId = `${series}-${editionCode}-${lesson}`;
      
      console.log('Downloading nibble:', nibbleId);
      
      // Call the PDF download endpoint
      const response = await fetch(`${BACKEND_URL}/api/interactive-lessons/download/nibble/${nibbleId}`);
      
      if (!response.ok) {
        // Try alternative download method - series download
        console.log('Nibble download failed, trying series download');
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
      a.download = `SoulFood_${series}_${lesson}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Download is being prepared. Please try again in a moment or visit the Interactive Lessons page.');
    } finally {
      setDownloading(prev => ({ ...prev, [item.name]: false }));
    }
  };

  const handleViewInteractive = (item) => {
    // Navigate to the interactive lesson page
    const seriesMatch = item.name.match(/Holiday|Breakfast|Lunch/i);
    const lessonMatch = item.name.match(/Covenant|Cradle|Cross|Comforter/i);
    
    const series = seriesMatch ? seriesMatch[0].toLowerCase() : 'holiday';
    const lesson = lessonMatch ? lessonMatch[0].toLowerCase() : 'covenant';
    
    navigate(`/lesson/${series}-${lesson}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
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

        {/* Order Items with Downloads */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Your Downloads
          </h2>
          
          {orderData?.items?.map((item, index) => {
            // Parse item details
            const seriesMatch = item.name?.match(/Holiday|Breakfast|Lunch/i);
            const lessonMatch = item.name?.match(/Covenant|Cradle|Cross|Comforter/i);
            const series = seriesMatch ? seriesMatch[0] : 'Holiday';
            const lesson = lessonMatch ? lessonMatch[0] : 'Covenant';
            
            return (
            <div key={index} className="border-b last:border-b-0 py-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name || `${series} Series - ${lesson}`}</h3>
                  <p className="text-sm text-gray-500">
                    {series} Series • {lesson} Lesson • Qty: {item.quantity || 1}
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
                  onClick={() => handleDownload(item, 'pdf')}
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
          ))}

          {!orderData?.items?.length && (
            <div className="text-center py-8 text-gray-500">
              <p>No items found. Your downloads should appear here.</p>
              <button
                onClick={() => navigate('/snack-packs')}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Browse Interactive Lessons →
              </button>
            </div>
          )}
        </div>

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
          <button
            onClick={() => navigate('/')}
            className="bg-white text-purple-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

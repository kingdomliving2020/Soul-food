import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const GiftCertificate = () => {
  const [selectedType, setSelectedType] = useState('book');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(50);

  const certificateTypes = {
    book: {
      name: 'Book Selection Gift Certificate',
      icon: '📚',
      description: 'Redeemable for any Soul Food series book',
      image: '/soul-food-logo.png',
      amounts: [25, 50, 75, 100]
    },
    mixup: {
      name: 'Mix-Up Game Pass',
      icon: '🎮',
      description: '8-hour game access pass',
      image: '/soul-food-logo.png',
      amounts: [10, 20, 30]
    },
    tricky: {
      name: 'Tricky Testament Game Pass',
      icon: '🎯',
      description: '8-hour game access pass',
      image: '/soul-food-logo.png',
      amounts: [10, 20, 30]
    },
    subscription: {
      name: 'Subscription Gift',
      icon: '🎁',
      description: 'Gift a Soul Food subscription',
      image: '/soul-food-logo.png',
      amounts: [9.99, 29.97, 109.89] // 1 month, 3 months, annual
    }
  };

  const handleGenerateCertificate = () => {
    if (!recipientName || !recipientEmail || !senderName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate certificate (this would connect to backend)
    toast.success('Gift certificate generated! Check your email.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Home</span>
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Gift Certificates</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            🎁 Gift Certificates
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Give the gift of spiritual nourishment! Valid for 1 year from purchase.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Certificate Type Selection */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Choose Gift Type</h3>
            <div className="space-y-4">
              {Object.entries(certificateTypes).map(([key, type]) => (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-all ${
                    selectedType === key 
                      ? 'border-2 border-orange-500 shadow-lg' 
                      : 'border border-slate-200 hover:border-orange-300'
                  }`}
                  onClick={() => setSelectedType(key)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{type.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-800">{type.name}</h4>
                        <p className="text-sm text-slate-600">{type.description}</p>
                      </div>
                      {selectedType === key && (
                        <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Amount Selection */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Select Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {certificateTypes[selectedType].amounts.map(amt => (
                    <Button
                      key={amt}
                      variant={amount === amt ? "default" : "outline"}
                      className={amount === amt ? "bg-orange-600 hover:bg-orange-700" : ""}
                      onClick={() => setAmount(amt)}
                    >
                      ${amt.toFixed(2)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Certificate Preview & Details */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Certificate Details</h3>
            
            {/* Preview */}
            <Card className="mb-6 bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-orange-300">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mb-4">
                    <img 
                      src="/soul-food-logo.png" 
                      alt="Soul Food" 
                      className="w-24 h-24 mx-auto object-contain"
                    />
                  </div>
                  <h3 className="text-3xl font-bold text-orange-800 mb-2">Gift Certificate</h3>
                  <p className="text-sm text-slate-600 mb-4">Valid for 1 year from purchase</p>
                  
                  <div className="bg-white rounded-lg p-6 mb-4">
                    <div className="text-4xl mb-2">{certificateTypes[selectedType].icon}</div>
                    <p className="font-semibold text-lg text-slate-800">{certificateTypes[selectedType].name}</p>
                    <p className="text-3xl font-bold text-orange-600 mt-4">${amount.toFixed(2)}</p>
                  </div>
                  
                  {recipientName && (
                    <p className="text-slate-700">
                      <span className="font-semibold">To:</span> {recipientName}
                    </p>
                  )}
                  {senderName && (
                    <p className="text-slate-700">
                      <span className="font-semibold">From:</span> {senderName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Recipient & Sender Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Name *</label>
                  <Input
                    placeholder="Jane Doe"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Email *</label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Personal Message (Optional)</label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-lg"
                    rows="3"
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleGenerateCertificate}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 text-lg font-semibold"
                >
                  Generate & Purchase - ${amount.toFixed(2)}
                </Button>
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Terms & Conditions:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>Gift certificates valid for 1 year from date of purchase</li>
                <li>Non-refundable but transferable</li>
                <li>Can be combined with other offers</li>
                <li>Physical paper certificate available upon request with Soul Food stickers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCertificate;

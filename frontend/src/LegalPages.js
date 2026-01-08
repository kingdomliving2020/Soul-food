import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Mail } from 'lucide-react';

// Privacy Policy Page
export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-orange-600" size={32} />
            <h1 className="text-3xl font-bold text-slate-800">Privacy Policy</h1>
          </div>
          
          <p className="text-slate-600 mb-8">
            <strong>Effective Date:</strong> January 1, 2026<br />
            <strong>Last Updated:</strong> January 7, 2026
          </p>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 mb-6">
              Kingdom Soul ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website kingdom-soul.com and use our Soul Food services.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">Personal Information</h3>
            <p className="text-slate-700 mb-4">We may collect personal information that you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Name and email address</li>
              <li>Billing and payment information (processed securely through Stripe)</li>
              <li>Account credentials</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">Automatically Collected Information</h3>
            <p className="text-slate-700 mb-4">When you access our website, we may automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Pages visited and interaction data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-700 mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Process transactions and deliver purchased content</li>
              <li>Create and manage your account</li>
              <li>Send order confirmations and download links</li>
              <li>Provide customer support</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Payment Processing</h2>
            <p className="text-slate-700 mb-4">
              We use Stripe as our payment processor. When you make a purchase, your payment information is transmitted directly to Stripe using their secure, encrypted systems. We do not store your full credit card information on our servers. Please review{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                Stripe's Privacy Policy
              </a>{' '}
              for information on how they handle your payment data.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Information Sharing</h2>
            <p className="text-slate-700 mb-4">We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li><strong>Service Providers:</strong> Third parties who assist in operating our website and processing payments (e.g., Stripe, email services)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Data Security</h2>
            <p className="text-slate-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-slate-700 mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent where applicable</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">7. Cookies</h2>
            <p className="text-slate-700 mb-4">
              We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze site traffic. You can control cookies through your browser settings.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">8. Children's Privacy</h2>
            <p className="text-slate-700 mb-4">
              Our services are not directed to children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">9. Changes to This Policy</h2>
            <p className="text-slate-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">10. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-slate-700">
                <strong>Kingdom Soul</strong><br />
                Email: <a href="mailto:privacy@kingdom-soul.com" className="text-orange-600 hover:text-orange-700">privacy@kingdom-soul.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Terms of Service Page
export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-orange-600" size={32} />
            <h1 className="text-3xl font-bold text-slate-800">Terms of Service</h1>
          </div>
          
          <p className="text-slate-600 mb-8">
            <strong>Effective Date:</strong> January 1, 2026<br />
            <strong>Last Updated:</strong> January 7, 2026
          </p>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 mb-6">
              Welcome to Kingdom Soul ("Soul Food," "we," "our," or "us"). By accessing or using our website and services at kingdom-soul.com, you agree to be bound by these Terms of Service.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-700 mb-4">
              By accessing or using our website, creating an account, or making a purchase, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Description of Services</h2>
            <p className="text-slate-700 mb-4">
              Kingdom Soul provides Christian educational content, Bible study materials, interactive lessons ("Nibbles" and "Snack Packs"), and related digital products. Our content is available in various editions including Adult Edition (AE), Youth Edition (YE), and Instructor Edition (IE).
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Account Registration</h2>
            <p className="text-slate-700 mb-4">To access certain features, you may need to create an account. You agree to:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Purchases and Payments</h2>
            <p className="text-slate-700 mb-4">When making purchases:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>All prices are in USD unless otherwise stated</li>
              <li>Payment is processed securely through Stripe</li>
              <li>You agree to pay all charges at the prices in effect when incurred</li>
              <li>Digital products are delivered via download links after payment confirmation</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Digital Products and Downloads</h2>
            <p className="text-slate-700 mb-4">For digital purchases:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Download links are provided after successful payment</li>
              <li>Links may expire after a specified period for security purposes</li>
              <li>You are responsible for downloading and saving your purchased content</li>
              <li>Lost downloads may be restored by contacting customer support</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Refund Policy</h2>
            <p className="text-slate-700 mb-4">
              Due to the digital nature of our products, all sales are generally final. However, we may consider refund requests on a case-by-case basis within 7 days of purchase if you have not downloaded the content. Please contact us at support@kingdom-soul.com for assistance.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-slate-700 mb-4">
              All content on our website, including text, graphics, logos, images, audio, video, and software, is the property of Kingdom Soul or its content creators and is protected by copyright and other intellectual property laws.
            </p>
            <p className="text-slate-700 mb-4">You may NOT:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Reproduce, distribute, or publicly display our content without permission</li>
              <li>Share download links or purchased content with unauthorized users</li>
              <li>Modify, create derivative works, or reverse engineer our materials</li>
              <li>Use our content for commercial purposes without written consent</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">8. User Conduct</h2>
            <p className="text-slate-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-slate-700 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of our website</li>
              <li>Upload malicious code or content</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">9. Instructor Accounts</h2>
            <p className="text-slate-700 mb-4">
              Instructor Edition (IE) content, including answer keys and facilitation notes, is provided exclusively for authorized instructors. Sharing IE content with non-instructors is strictly prohibited and may result in account termination.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-slate-700 mb-4">
              Our services are provided "as is" without warranties of any kind, either express or implied. We do not guarantee that our website will be uninterrupted, error-free, or free of viruses.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">11. Limitation of Liability</h2>
            <p className="text-slate-700 mb-4">
              To the maximum extent permitted by law, Kingdom Soul shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-slate-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the updated Terms on our website. Continued use after changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">13. Contact Us</h2>
            <p className="text-slate-700 mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-slate-700">
                <strong>Kingdom Soul</strong><br />
                Email: <a href="mailto:support@kingdom-soul.com" className="text-orange-600 hover:text-orange-700">support@kingdom-soul.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { PrivacyPolicy, TermsOfService };

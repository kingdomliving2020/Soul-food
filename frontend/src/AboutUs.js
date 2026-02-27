/**
 * About Us Page - Meet the Soul Food Project Team
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Heart } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();

  const teamMembers = [
    {
      id: 'dr-shefa-brown',
      name: 'Dr. Shefa D. Brown',
      image: '/images/dr-shefa-brown.png',
      isFounder: true
    },
    {
      id: 'dr-temia-julius',
      name: 'Pastor Temia Julius, Ph.D.',
      image: '/images/team/dr-temia-julius.jpg',
      isFounder: false
    },
    {
      id: 'evang-rose-doctor',
      name: 'Evangelist Rose Doctor',
      image: '/images/team/evang-rose-doctor.jpg',
      isFounder: false
    },
    {
      id: 'pastor-mike-edwards',
      name: 'Pastor Mike Edwards',
      image: '/images/team/pastor-mike-edwards.jpg',
      isFounder: false
    }
  ];

  const missionStatement = {
    main: "We exist to encourage, inspire, and enlighten those who are hungry for a deeper, more meaningful connection with the Great I AM. We share God's truth in a way that is relatable and life-giving, equipping believers to grow in faith, walk in purpose, and reflect Christ with confidence in everyday life.",
    vision: "We aim to help raise up the \"walking epistles\" of this generation—living testimonies who carry God's Word with humility, courage, and love. Together, we gather to break bread in the Word, strengthen one another, and grow sharper through authentic discipleship—because iron sharpens iron.",
    approach: "To support different learning styles and keep engagement high, we incorporate online and in-person games and interactive activities that reinforce each lesson, promote healthy discussion, and help learners retain truth through meaningful practice."
  };

  const scriptureAnchors = [
    { reference: 'Exodus 3:14', topic: 'The Great "I AM"' },
    { reference: '2 Corinthians 3:2–3', topic: '"Walking epistles" (living letters)' },
    { reference: 'Acts 2:42, 46', topic: '"Break bread" fellowship & teaching' },
    { reference: 'Proverbs 27:17', topic: '"Iron sharpens iron"' },
    { reference: 'Ephesians 4:11–13', topic: 'Equipping the saints' },
    { reference: '1 Thessalonians 5:11', topic: 'Encouraging/building one another' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <img src="/soul-food-logo.png" alt="Soul Food" className="w-12 h-12" />
              <div>
                <h1 className="text-lg font-bold text-slate-800">About Us</h1>
                <p className="text-xs text-slate-500">Meet the Team</p>
              </div>
            </div>

            <Button onClick={() => navigate('/quick-order')} className="bg-purple-600 hover:bg-purple-700">
              Shop Now
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
            🙏 Our Ministry
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Meet the Kingdom Soul Team
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Four ordained ministers united by a passion for spiritual education and a vision to nourish souls with God's Word—one lesson, one family, one community at a time.
          </p>
        </div>

        {/* Founder Card - Dr. Shefa D. Brown */}
        <div className="mb-16">
          <Card className="overflow-hidden border-2 border-purple-200 shadow-2xl bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative h-80 md:h-auto">
                  <img 
                    src="/images/dr-shefa-brown-final.jpg" 
                    alt="Dr. Shefa D. Brown"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-amber-500 text-white px-3 py-1 font-bold shadow-lg">
                      ✨ Founder
                    </Badge>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-slate-800 mb-1">
                    Dr. Shefa D. Brown
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mb-6">Kingdom Soul Team</p>
                  
                  <div className="flex items-center gap-2 text-purple-600">
                    <Heart className="w-5 h-5 fill-purple-200" />
                    <span className="text-sm font-medium">"Feeding souls, one lesson at a time"</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Our Team</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.filter(m => !m.isFounder).map(member => (
              <Card 
                key={member.id} 
                className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-purple-100"
              >
                <div className="h-72 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">Kingdom Soul Team</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <Card className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-2xl mb-12">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Kingdom Soul Mission</h2>
            
            <div className="space-y-6 text-purple-100 leading-relaxed">
              <p className="text-lg md:text-xl">
                {missionStatement.main}
              </p>
              
              <p className="text-lg md:text-xl">
                {missionStatement.vision}
              </p>
              
              <p className="text-lg md:text-xl">
                {missionStatement.approach}
              </p>
            </div>
            
            <p className="text-purple-200 font-medium text-center mt-8">— The Kingdom Soul Team</p>
          </CardContent>
        </Card>

        {/* Scripture Anchors */}
        <Card className="shadow-xl mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Scripture Anchors</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scriptureAnchors.map((scripture, idx) => (
                <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-purple-700 font-semibold text-sm">{scripture.topic}</p>
                  <p className="text-slate-600 text-sm mt-1">📖 {scripture.reference}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-slate-50 shadow-xl">
          <CardContent className="p-8 md:p-12 text-center">
            <p className="text-slate-600 mb-4">Ready to start your journey?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/quick-order')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold px-6"
              >
                Browse Our Products
              </Button>
              <Button 
                onClick={() => navigate('/lesson/free-sample')}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 font-bold px-6"
              >
                Try Free Sample
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Get in Touch</h2>
          <p className="text-slate-600 mb-6">
            Have questions about Soul Food or want to bring our curriculum to your church or community?
          </p>
          <Button 
            onClick={() => window.location.href = 'mailto:support@kingdom-soul.com'}
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Us
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/soul-food-logo.png" alt="Soul Food" className="w-10 h-10" />
            <span className="text-xl font-bold">Soul Food</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2025 Kingdom Living Project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;

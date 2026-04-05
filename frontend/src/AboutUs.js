/**
 * About Us Page - Meet the Soul Food Project Team
 * Team photos extracted from uploaded PDFs, bios from IE/Credits pages
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Heart, ChevronDown, ChevronUp } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();
  const [expandedMember, setExpandedMember] = useState(null);

  const teamMembers = [
    {
      id: 'dr-brown',
      name: 'Dr. Brown',
      title: 'Series Founder',
      image: '/team/dr-brown.jpg',
      isFounder: true,
      quote: "Growing up in Boston, my grandmother, Pastor Pearl Doctor, always brought both the food and the Word to the table.",
      bio: "You couldn't walk into her home without smelling something cooking and hearing something spiritual on the radio. Whether you came in upset, excited, nervous, or afraid, she would bring you back to center—with the Word of God in one hand and a plate of food in the other.\n\nShe didn't wait until Sunday to offer support. She lived what I now call \"Truth Served Daily\"—sharing God's Word like heavenly bread alongside whatever she had on the stove. I watched family and friends find peace in that kind of soul food, the kind that nourishes the inner person and prepares us for more than the moment we're in.\n\nThis Soul Food series was born from that legacy. Designed for teachers, facilitators, and ministry leaders in Bible study circles, cell groups, and Sunday school settings, each lesson offers bite-sized, life-giving \"courses\" to help your class lay a strong foundation in Christ, deepen fellowship, and share what God is doing in them with others.\n\nMy hope is that these pages bring comfort, clarity, and courage—and inspire you to pass that soul food along. Be blessed!"
    },
    {
      id: 'dr-temia-julius',
      name: 'Dr. Temia Joy Julius',
      title: 'Soul Food Team',
      image: '/team/temia-julius.jpg',
      isFounder: false,
      quote: "Sometimes I think about God's word the same way I think about a plate of real soul food — the kind that warms you from the inside out.",
      bio: "It's like when Grandma would call everybody to the table — cousins, aunties, neighbors who just \"happened to stop by.\" Didn't matter who you were or what kinda day you'd had. If you walked in hungry, you were leaving full. That's what God's Word does. It gathers, it feeds, it heals — and it never runs out.\n\nSoul food isn't just about the seasoning; it's about the love cooked into it. The stories, the history, the survival. God's Word carries that same love and legacy. It reminds us we come from strength and purpose, from a God who was covering us long before we ever called His name.\n\nAnd when life gets heavy, that Word hits different — like hot cornbread on the plate, collard-green truth that says, \"You're still standing,\" and a peach-cobbler sweetness that whispers, \"Better days are coming.\"\n\nThis Soul Food isn't just for one group, one church, or one zip code. God's Word is a table big enough for every culture, every color, every background. In a world that leaves people spiritually starved — hungry for peace, truth, connection, something real — His Word fills the empty places with wisdom for the mind, strength for the body, and comfort for the heart.\n\nIt's food that nourishes. Food that brings us together. Food that reminds us who we are and whose we are. That's why we need it. That's why we keep coming back to the table. It's food for your soul. Real Soul Food."
    },
    {
      id: 'pastor-michael-edwards',
      name: 'Pastor Michael Edwards, II',
      title: 'Soul Food Team',
      image: '/team/michael-edwards.jpg',
      isFounder: false,
      quote: "Soul Food is a refreshing and deeply nourishing contribution to Christian living—blending biblical truth with the comforting familiarity of foods that warm our tables.",
      bio: "With creativity, pastoral wisdom, and practical insight, this series serves a full-course spiritual meal designed to strengthen, challenge, and transform both you and the youth you lead.\n\nUsing the metaphor of comfort foods—those dishes that remind us of home, safety, and love—Soul Food lays out biblical principles in a way that is accessible, relatable, and impactful. Each lesson takes a familiar food and uses it as an entry point into Scripture, revealing how God nourishes the spirit the same way a well-cooked meal nourishes the body.\n\nFrom patience simmering like a slow stew, to forgiveness rising like fresh bread, to faith seasoned through trials, every teaching is grounded firmly in the Word of God.\n\nDesigned for pastors, youth leaders, teachers, and small-group facilitators, it includes guided prompts, discussion questions, and activity ideas that help you lead powerful, time-efficient lessons without starting from scratch.\n\nPastoral, engaging, and full of spiritual warmth, Soul Food is more than a book—it's an experience. It reminds us that God still prepares tables in wilderness seasons and that His Word remains the ultimate comfort meal for weary souls."
    },
    {
      id: 'evang-rose-doctor',
      name: 'Evangelist Rose Doctor',
      title: 'Soul Food Team',
      image: '/team/rose-doctor.jpg',
      isFounder: false,
      quote: "Truth Served Daily — sharing God's Word like heavenly bread alongside whatever she had on the stove.",
      bio: "A key contributor to the Soul Food Break*fast Adult Edition, Evangelist Rose Doctor brings a heart for service and a deep love for God's Word to every lesson. Her work ensures that each page carries the warmth, authenticity, and spiritual depth that makes Soul Food what it is."
    }
  ];

  const missionStatement = {
    main: "We exist to encourage, inspire, and enlighten those who are hungry for a deeper, more meaningful connection with the Great I AM. We share God's truth in a way that is relatable and life-giving, equipping believers to grow in faith, walk in purpose, and reflect Christ with confidence in everyday life.",
    vision: "We aim to help raise up the \"walking epistles\" of this generation—living testimonies who carry God's Word with humility, courage, and love. Together, we gather to break bread in the Word, strengthen one another, and grow sharper through authentic discipleship—because iron sharpens iron.",
    approach: "To support different learning styles and keep engagement high, we incorporate online and in-person games and interactive activities that reinforce each lesson, promote healthy discussion, and help learners retain truth through meaningful practice."
  };

  const scriptureAnchors = [
    { reference: 'Exodus 3:14', topic: 'The Great "I AM"' },
    { reference: '2 Corinthians 3:2-3', topic: '"Walking epistles" (living letters)' },
    { reference: 'Acts 2:42, 46', topic: '"Break bread" fellowship & teaching' },
    { reference: 'Proverbs 27:17', topic: '"Iron sharpens iron"' },
    { reference: 'Ephesians 4:11-13', topic: 'Equipping the saints' },
    { reference: '1 Thessalonians 5:11', topic: 'Encouraging/building one another' }
  ];

  const founder = teamMembers.find(m => m.isFounder);
  const team = teamMembers.filter(m => !m.isFounder);

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
              data-testid="back-to-home-btn"
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

            <Button onClick={() => navigate('/quick-order')} className="bg-purple-600 hover:bg-purple-700" data-testid="shop-now-btn">
              Shop Now
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16" data-testid="about-hero">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
            Our Ministry
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Meet the Soul Food Team
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Four ordained ministers united by a passion for spiritual education and a vision to nourish souls 
            with God's Word—one lesson, one family, one community at a time.
          </p>
        </div>

        {/* Founder Card - Dr. Brown */}
        {founder && (
          <div className="mb-16" data-testid="founder-card">
            <Card className="overflow-hidden border-2 border-purple-200 shadow-2xl bg-gradient-to-br from-white to-purple-50">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image */}
                  <div className="relative h-80 md:h-auto min-h-[320px]">
                    <img 
                      src={founder.image}
                      alt={founder.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-amber-500 text-white px-3 py-1 font-bold shadow-lg">
                        Founder
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-1">
                      {founder.name}
                    </h2>
                    <p className="text-sm text-purple-600 font-semibold mb-4">{founder.title}</p>
                    
                    <blockquote className="text-slate-600 italic border-l-4 border-purple-300 pl-4 mb-4 text-sm leading-relaxed">
                      "{founder.quote}"
                    </blockquote>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${expandedMember === founder.id ? 'max-h-[1000px]' : 'max-h-0'}`}>
                      <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pt-2">
                        {founder.bio}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedMember(expandedMember === founder.id ? null : founder.id)}
                      className="mt-3 text-purple-600 hover:text-purple-800 w-fit"
                      data-testid="founder-read-more-btn"
                    >
                      {expandedMember === founder.id ? (
                        <><ChevronUp className="w-4 h-4 mr-1" /> Read Less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-1" /> Read Full Story</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Members Grid */}
        <div className="mb-16" data-testid="team-grid">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Our Team</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map(member => (
              <Card 
                key={member.id} 
                className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-purple-100"
                data-testid={`team-card-${member.id}`}
              >
                <div className="h-72 overflow-hidden bg-slate-100">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-xs text-purple-600 font-semibold mb-3">{member.title}</p>
                  
                  <blockquote className="text-slate-500 italic text-sm border-l-3 border-purple-200 pl-3 mb-3 line-clamp-3">
                    "{member.quote}"
                  </blockquote>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${expandedMember === member.id ? 'max-h-[800px]' : 'max-h-0'}`}>
                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pt-2">
                      {member.bio}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                    className="mt-2 text-purple-600 hover:text-purple-800 p-0 h-auto"
                    data-testid={`read-more-${member.id}`}
                  >
                    {expandedMember === member.id ? (
                      <><ChevronUp className="w-4 h-4 mr-1" /> Less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 mr-1" /> Read More</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* "Why Soul Food?" Section */}
        <Card className="mb-12 shadow-xl border border-purple-100" data-testid="why-soul-food">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 text-center">Why Soul Food?</h2>
            <div className="max-w-3xl mx-auto text-slate-600 leading-relaxed space-y-4">
              <p>
                Growing up in Boston, Dr. Brown's grandmother, <strong>Pastor Pearl Doctor</strong>, always brought both 
                the food and the Word to the table. Whether you came in upset, excited, nervous, or afraid, she would 
                bring you back to center—with the Word of God in one hand and a plate of food in the other.
              </p>
              <p>
                She lived what we now call <em>"Truth Served Daily"</em>—sharing God's Word like heavenly bread 
                alongside whatever she had on the stove. Family and friends found peace in that kind of soul food, the 
                kind that nourishes the inner person and prepares us for more than the moment we're in.
              </p>
              <p className="text-purple-700 font-semibold text-center bg-purple-50 rounded-xl px-6 py-4">
                This Soul Food Bible Study series was born from that legacy—bite-sized, life-giving lessons to help 
                lay a strong foundation in Christ, deepen fellowship, and share what God is doing in each of us.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mission Statement */}
        <Card className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-2xl mb-12" data-testid="mission-statement">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Kingdom Soul Mission</h2>
            
            <div className="space-y-6 text-purple-100 leading-relaxed max-w-4xl mx-auto">
              <p>{missionStatement.main}</p>
              <p>{missionStatement.vision}</p>
              <p>{missionStatement.approach}</p>
            </div>
            
            <p className="text-purple-200 font-medium text-center mt-8">— The Soul Food Team</p>
          </CardContent>
        </Card>

        {/* Scripture Anchors */}
        <Card className="shadow-xl mb-12" data-testid="scripture-anchors">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Scripture Anchors</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scriptureAnchors.map((scripture, idx) => (
                <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-purple-700 font-semibold text-sm">{scripture.topic}</p>
                  <p className="text-slate-600 text-sm mt-1">{scripture.reference}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-slate-50 shadow-xl" data-testid="about-cta">
          <CardContent className="p-8 md:p-12 text-center">
            <p className="text-slate-600 mb-4">Ready to start your journey?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/quick-order')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold px-6"
                data-testid="browse-products-btn"
              >
                Browse Our Products
              </Button>
              <Button 
                onClick={() => navigate('/lesson/free-sample')}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 font-bold px-6"
                data-testid="try-free-sample-btn"
              >
                Try Free Sample
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="mt-16 text-center" data-testid="contact-section">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Get in Touch</h2>
          <p className="text-slate-600 mb-6">
            Have questions about Soul Food or want to bring our curriculum to your church or community?
          </p>
          <Button 
            onClick={() => window.location.href = 'mailto:support@kingdom-soul.com'}
            variant="outline"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
            data-testid="contact-btn"
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
            © 2025 Overflow Harvest, LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;

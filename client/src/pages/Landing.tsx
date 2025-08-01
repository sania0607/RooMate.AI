import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Brain, Mic, MessageCircle, Users, Eye } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useLocation } from "wouter";

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if user is already authenticated
    fetch('/api/auth/user', { credentials: 'include' })
      .then(response => {
        if (response.ok) {
          navigate('/dashboard');
        }
      })
      .catch(() => {
        // User not authenticated, stay on landing page
      });
  }, [navigate]);

  const handleGetStarted = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Heart className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-gray-900">RooMate.ai</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-purple-600 transition-colors">How It Works</a>
              <a href="#safety" className="text-gray-600 hover:text-purple-600 transition-colors">Safety</a>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ username: 'demo', password: 'password123' })
                    });
                    if (response.ok) {
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Demo login failed:', error);
                  }
                }}
                variant="outline" 
                className="text-purple-600 border-purple-600"
              >
                Demo Login
              </Button>
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white">
                Get Started
              </Button>
            </div>
            <button className="md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Find your <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">perfect roommate</span> through AI magic
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Revolutionary AI-powered roommate matching designed exclusively for women. Create safer, happier living spaces through intelligent personality and lifestyle compatibility.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Mic className="mr-2 w-5 h-5" />
                  Create Profile with Voice
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-purple-500 text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-500 hover:text-white transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
              <div className="flex items-center mt-6 text-sm text-gray-500 space-x-6">
                <div className="flex items-center">
                  <Users className="text-purple-500 mr-2 w-4 h-4" />
                  Women-only platform
                </div>
                <div className="flex items-center">
                  <Shield className="text-pink-500 mr-2 w-4 h-4" />
                  Safety verified
                </div>
                <div className="flex items-center">
                  <Brain className="text-orange-500 mr-2 w-4 h-4" />
                  AI-powered matching
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-xl" />
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
                <div className="text-center text-white relative z-10">
                  <div className="relative">
                    <Heart className="w-16 h-16 mx-auto mb-4" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-semibold">Your perfect roommate match awaits!</p>
                  <p className="text-sm text-white/80 mt-2">Join 10,000+ women finding their ideal living situation</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">98% compatibility match!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Smart Features for Safe Roommate Matching
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform goes beyond basic preferences to ensure true compatibility and safety.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow border border-purple-100">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Mic className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Voice-Powered Profiles</h3>
                <p className="text-gray-600">Simply speak your preferences and lifestyle details. Our AI converts voice to detailed profile information.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-pink-50 to-orange-50 hover:shadow-lg transition-shadow border border-pink-100">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <Heart className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Swipe to Match</h3>
                <p className="text-gray-600">Tinder-style interface makes finding compatible roommates fun and intuitive. Swipe right to connect!</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-lg transition-shadow border border-orange-100">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Indicators</h3>
                <p className="text-gray-600">Visual compatibility indicators show potential conflicts or perfect matches before you swipe.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg transition-shadow border border-purple-100">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Brain className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Compatibility</h3>
                <p className="text-gray-600">Advanced algorithms analyze lifestyle, habits, and preferences to calculate compatibility scores.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-lg transition-shadow border border-green-100">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Safety First</h3>
                <p className="text-gray-600">Women-only platform with admin monitoring and safety verification for peace of mind.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-shadow border border-blue-100">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <MessageCircle className="text-white w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Messaging</h3>
                <p className="text-gray-600">Chat with matches in a safe environment before meeting in person.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Swipe Feature Section */}
      <section className="py-20 bg-gradient-to-br from-primary-light/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Smart Swipe Matching Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent swipe interface makes finding compatible roommates intuitive, safe, and fun. Here's everything you need to know about our matching system.
            </p>
          </div>

          {/* Main Swipe Demo */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How Swiping Works</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Heart className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Swipe Right to Like</h4>
                    <p className="text-gray-600">Found someone compatible? Swipe right or tap the heart to show interest. They'll only know if they like you back!</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-warning rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Swipe Left to Pass</h4>
                    <p className="text-gray-600">Not feeling the connection? Swipe left to pass privately. They'll never know you weren't interested.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <MessageCircle className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Mutual Match</h4>
                    <p className="text-gray-600">When both users swipe right, it's a match! You can now message each other and start planning your living situation.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full max-w-sm mx-auto">
                {/* Phone Mockup */}
                <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl">
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {/* Profile Card Mockup */}
                    <div className="relative h-96 bg-gradient-to-br from-pink-100 to-purple-100">
                      <div className="absolute top-4 left-4 right-4">
                        <div className="bg-white rounded-lg p-3 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Sarah, 24</h4>
                            <div className="bg-secondary text-white text-xs px-2 py-1 rounded-full">95% Match</div>
                          </div>
                          <p className="text-sm text-gray-600">Marketing Professional • Non-smoker</p>
                        </div>
                      </div>
                      
                      {/* Compatibility Indicators */}
                      <div className="absolute bottom-20 left-4 right-4 space-y-2">
                        <div className="bg-secondary/90 text-white text-xs px-3 py-2 rounded-full flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          Similar sleep schedule
                        </div>
                        <div className="bg-secondary/90 text-white text-xs px-3 py-2 rounded-full flex items-center">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          Both love clean spaces
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-6">
                        <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <svg className="text-warning w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center">
                          <Heart className="text-white w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Details */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white border-primary/20">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                  <Brain className="text-primary w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Compatibility Score</h4>
                <p className="text-sm text-gray-600">See your percentage match based on lifestyle, preferences, and habits before you swipe.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-secondary/20">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="text-secondary w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Green Flags</h4>
                <p className="text-sm text-gray-600">Instant highlights of perfect compatibility matches in lifestyle and preferences.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-warning/20">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="text-warning w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L5.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Red Flag Warnings</h4>
                <p className="text-sm text-gray-600">Potential conflicts highlighted upfront to help you make informed decisions.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-blue-200">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="text-blue-500 w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Detailed Profiles</h4>
                <p className="text-sm text-gray-600">View comprehensive lifestyle info, photos, and preferences before making your choice.</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Features */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Advanced Swipe Features</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="text-primary w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Keyboard Shortcuts</h4>
                <p className="text-sm text-gray-600 mb-3">Navigate faster with arrow keys: ← to pass, → to like</p>
                <div className="flex justify-center space-x-2">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">←</kbd>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">→</kbd>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="text-secondary w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Undo Last Swipe</h4>
                <p className="text-sm text-gray-600">Changed your mind? Take back your last swipe action within 10 seconds</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="text-blue-500 w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Smart Filters</h4>
                <p className="text-sm text-gray-600">Filter by age, location, budget range, and specific lifestyle preferences</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-neutral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How RooMate.ai Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to find your perfect roommate match
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create Profile</h3>
              <p className="text-gray-600">Use voice input to quickly set up your profile with preferences, lifestyle, and requirements.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis</h3>
              <p className="text-gray-600">Our smart algorithm analyzes compatibility factors and generates personalized matches.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Swipe & Match</h3>
              <p className="text-gray-600">Browse potential roommates with red/green flag indicators and swipe right to connect.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect Safely</h3>
              <p className="text-gray-600">When both users match, start secure messaging and plan your next steps together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Your Safety is Our Priority
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Built specifically for women, with comprehensive safety features and admin monitoring.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <Shield className="text-secondary w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Women-Only Platform</h4>
                    <p className="text-gray-600">Exclusive community designed to address women's unique housing safety concerns.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <svg className="text-secondary w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Admin Monitoring</h4>
                    <p className="text-gray-600">24/7 platform monitoring with quick response to reports and flags.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <svg className="text-secondary w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Secure Messaging</h4>
                    <p className="text-gray-600">Protected communication environment with privacy controls.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                    <svg className="text-secondary w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Profile Verification</h4>
                    <p className="text-gray-600">Multi-step verification process to ensure authentic users.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-secondary/20 to-secondary/40 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-800">Safe & Secure Platform</p>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-secondary rounded-2xl shadow-lg p-6 border border-white">
                <div className="text-center">
                  <Shield className="text-white w-8 h-8 mx-auto mb-2" />
                  <div className="text-white font-bold text-sm">100% Safe</div>
                  <div className="text-green-100 text-xs">Platform</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Find Your Perfect Roommate?
          </h2>
          <p className="text-xl text-primary-light mb-8">
            Join thousands of women who've found their ideal living situation through RooMate.ai
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              className="bg-white text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 shadow-lg"
            >
              <Mic className="mr-2 w-5 h-5" />
              Create Profile with Voice
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-primary"
            >
              Watch Demo Video
            </Button>
          </div>
          
          <div className="flex items-center justify-center mt-8 space-x-8 text-primary-light">
            <div className="flex items-center">
              <Users className="mr-2 w-4 h-4" />
              <span className="text-sm">2,000+ Users</span>
            </div>
            <div className="flex items-center">
              <Heart className="mr-2 w-4 h-4" />
              <span className="text-sm">1,200+ Matches</span>
            </div>
            <div className="flex items-center">
              <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm">4.9/5 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <Heart className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-bold">RooMate.ai</span>
              </div>
              <p className="text-gray-400 mb-6">
                AI-powered roommate matching platform designed specifically for women's safety and compatibility.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H9a1 1 0 010 2H7a1 1 0 01-.707-1.707L8.771 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issues</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RooMate.ai. All rights reserved. Made with ❤️ for women's safety and comfort.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}

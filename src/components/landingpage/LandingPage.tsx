import React from 'react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">Neighbour<span className="text-purple-600">Link</span></span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition duration-300">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition duration-300">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-indigo-600 transition duration-300">Testimonials</a>
              <a href="#download" className="text-gray-600 hover:text-indigo-600 transition duration-300">Download</a>
            </div>
            <div className="flex items-center">
              <a href="#" className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300">Sign Up</a>
              <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-indigo-600 focus:outline-none">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="gradient-bg relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <div className="mt-12 lg:mt-24">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
                  Connect with your neighbors like never before
                </h1>
                <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
                  NeighbourLink is a hyperlocal platform that helps you share resources, find urgent assistance, and build a stronger community—all within your neighborhood.
                </p>
                <div className="mt-10 flex space-x-4">
                  <a href="#download" className="cta-button inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-8 shadow-lg">
                    Get Started
                  </a>
                  <a href="#how-it-works" className="cta-button inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-8">
                    How It Works
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="mt-12 lg:mt-16 lg:ml-8 pulse-animation">
                <img src="/api/placeholder/400/820" alt="NeighbourLink App" className="app-screenshot w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to build a stronger community
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              NeighbourLink makes it easy to connect with your neighbors and share resources.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="feature-card bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="fas fa-exchange-alt text-2xl feature-icon"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Resource Sharing</h3>
              <p className="text-gray-600">
                Share underutilized items like tools, medical equipment, or books with trusted neighbors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="fas fa-bell text-2xl feature-icon"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Emergency Alerts</h3>
              <p className="text-gray-600">
                Broadcast urgent needs to neighbors within a 2km radius via push notifications and SMS.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="fas fa-comments text-2xl feature-icon"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Communication</h3>
              <p className="text-gray-600">
                Chat privately with neighbors using our end-to-end encrypted messaging system.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="fas fa-user-check text-2xl feature-icon"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trust Building</h3>
              <p className="text-gray-600">
                Earn "Trusted Neighbor" badges through ID verification and positive community interactions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="fas fa-map-marker-alt text-2xl feature-icon"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hyperlocal Focus</h3>
              <p className="text-gray-600">
                Connect with neighbors within 1-5km radius, creating a truly local community network.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="fas fa-shield-alt text-2xl feature-icon"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Safety & Privacy</h3>
              <p className="text-gray-600">
                Coordinate safe pickup locations and maintain privacy with anonymous posting options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How NeighbourLink Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Building community connections has never been easier
            </p>
          </div>

          <div className="mt-16">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">Sign Up & Verify</h3>
                <p className="mt-5 text-base text-gray-500">
                  Create an account using your phone number or email, then verify your identity to earn a "Trusted Neighbor" badge.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="mt-10 lg:mt-0 text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">Post & Search</h3>
                <p className="mt-5 text-base text-gray-500">
                  Post requests or offers for resources, or search for items you need within your neighborhood radius (1-5km customizable).
                </p>
              </div>

              {/* Step 3 */}
              <div className="mt-10 lg:mt-0 text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-600">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">Connect & Share</h3>
                <p className="mt-5 text-base text-gray-500">
                  Communicate through secure messaging, arrange meetups at safe locations, and start building relationships with your neighbors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Users Are Saying
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Real stories from people using NeighbourLink to build stronger communities
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-500">JS</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Jennifer S.</h4>
                  <p className="text-gray-500 text-sm">Oakland, CA</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "When my son needed crutches after a sports injury, I posted an urgent request on NeighbourLink. Within 30 minutes, a neighbor three blocks away offered to lend us a pair. We saved hundreds of dollars and made a new friend!"
              </p>
              <div className="mt-4 flex text-yellow-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-500">MR</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Michael R.</h4>
                  <p className="text-gray-500 text-sm">Austin, TX</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "During the last power outage, NeighbourLink's emergency alert system helped our street coordinate sharing generators and refrigerator space. It turned a stressful situation into a block party!"
              </p>
              <div className="mt-4 flex text-yellow-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star-half-alt"></i>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-500">AP</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Alicia P.</h4>
                  <p className="text-gray-500 text-sm">Chicago, IL</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "As a new mom working from home, I felt isolated until I found NeighbourLink. I've borrowed baby equipment, found a babysitting swap, and finally feel connected to my neighborhood after living here for years."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to connect with your community?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-100">
            Download NeighbourLink today and start building relationships with your neighbors.
          </p>
          
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            <a href="#" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg transition duration-300 transform hover:-translate-y-1">
              <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-7.37 10c0-.8.13-1.58.38-2.31L9.88 14.5v.01l2.06 2.05-6.95 4.04A7.976 7.976 0 0 1 4.63 12zm3.08-6.55L6.59 9.12l2.04 2.04L10.15 13l-3.58 2.07 7.73-4.5L7.71 5.45zM12 4a7.95 7.95 0 0 1 4.75 1.58L11.4 9.39 6.92 12 12 14.92l5.23-3.05-2.55 4.02L12.38 20h-.76c-4.4-.01-7.92-3.54-7.93-7.94 0-4.4 3.53-7.94 7.93-7.95h.38l.05-.06L12 4zm8 8c0 2.8-1.45 5.27-3.63 6.71L13.5 12l2.88-4.53A7.96 7.96 0 0 1 20 12z"/>
              </svg>
              Play Store
            </a>
            <a href="#" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg transition duration-300 transform hover:-translate-y-1">
              <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.462 8.293a4.144 4.144 0 0 0-.985-1.049 4.08 4.08 0 0 0-5.166.351 4.133 4.133 0 0 0-.913 1.287 4.151 4.151 0 0 0-.913-1.287 4.08 4.08 0 0 0-5.166-.351 4.144 4.144 0 0 0-.985 1.049 4.151 4.151 0 0 0 .228 5.288l5.345 5.35c.8.8 2.093.81 2.981 0l5.345-5.35a4.151 4.151 0 0 0 .229-5.288z"/>
              </svg>
              App Store
            </a>
          </div>
          
          <div className="mt-12">
            <img src="/api/placeholder/800/350" alt="NeighbourLink App Screenshots" className="mx-auto rounded-xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">NeighbourLink</h3>
              <p className="text-gray-400">
                Building stronger communities one connection at a time.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <span className="sr-only">Facebook</span>
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <span className="sr-only">Twitter</span>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <span className="sr-only">Instagram</span>
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Community Guidelines</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Safety Tips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">FAQs</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Community Standards</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} NeighbourLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
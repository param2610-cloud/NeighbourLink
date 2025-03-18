import { useEffect, useState } from 'react';
import './LandingPage.css';
import { motion } from 'framer-motion';
import { auth } from '@/firebase';
import '@fortawesome/fontawesome-svg-core/styles.css';

const LandingPage = () => {

  const [bgImage, setBgImage] = useState('bg-1')
  const [, setPrevImage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    });

    document.querySelectorAll('.animate-on-scroll').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    let c = 1;
    const intervalId = setInterval(() => {
      setPrevImage(bgImage);
      setBgImage(`bg-${c}`);
      c++;
      if (c > 4) {
        c = 1;
      }
    }, 8000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <div className='h-screen w-full flex justify-center items-center fixed'>
        <img src="/assets/base-img.jpg" alt="" className='h-full w-full'
          style={{
            filter: 'brightness(0.5) contrast(1.2)'
          }} />
      </div>
      <div className="landing-page absolute top-0 left-0">
        {/* Navigation */}
        <nav className="bg-white dark:bg-neutral-800 shadow-md fixed w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Neighbour<span className="text-purple-600 dark:text-purple-400">Link</span></span>
                </div>
              </div>
              <div className="hidden md:flex items-center font-extrabold  space-x-8">
                <a href="#features" className="text-gray-600 dark:text-gray-200 hover:text-indigo-600 transition duration-300">Features</a>
                <a href="#how-it-works" className="text-gray-600 dark:text-gray-200 hover:text-indigo-600 transition duration-300">How It Works</a>
                <a href="#testimonials" className="text-gray-600 dark:text-gray-200 hover:text-indigo-600 transition duration-300">Testimonials</a>
                <a href="#download" className="text-gray-600 dark:text-gray-200 hover:text-indigo-600 transition duration-300">Download</a>
              </div>


              <div className="flex items-center">
                {
                  user ?
                    <a href="/" className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300">DashBoard</a>
                    :
                    <a href="login" className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300">Sign In</a>
                }
                {/* Uncomment and fix mobile menu button */}
                <button className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-indigo-600 focus:outline-none" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle mobile menu">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-neutral-800">
                <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-neutral-700 hover:text-indigo-600 transition duration-300">Features</a>
                <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-neutral-700 hover:text-indigo-600 transition duration-300">How It Works</a>
                <a href="#testimonials" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-neutral-700 hover:text-indigo-600 transition duration-300">Testimonials</a>
                <a href="#download" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-neutral-700 hover:text-indigo-600 transition duration-300">Download</a>
                {!user && (
                  <>
                    <a href="/register" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:bg-opacity-90 transition duration-300">Sign Up</a>
                    <a href="/login" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:bg-opacity-90 transition duration-300">Sign In</a>
                  </>
                )}
                {user && (
                  <a href="/" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:bg-opacity-90 transition duration-300">Profile</a>
                )}
              </div>
            </motion.div>
          )}
        </nav>


        {/* Hero Section */}
        <div className={`${bgImage} w-full bg-property relative pt-20 pb-32 overflow-hidden`}>
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-6">
                <div className="mt-12 lg:mt-24">
                  <motion.div
                    initial={{ x: '-50%' }} // start from the right
                    animate={{ x: 0 }} // animate to the left
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight motion-preset-slide-right">
                    Connect with your neighbors like never before
                  </motion.div>
                  <motion.div
                    initial={{ x: '-70%' }} // start from the right
                    animate={{ x: 0 }} // animate to the left
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="mt-6 text-xl text-indigo-100 max-w-3xl motion-preset-slide-right">
                    NeighbourLink is a hyperlocal platform that helps you share resources, find urgent assistance, and build a stronger community—all within your neighborhood.
                  </motion.div>
                  <motion.button
                    initial={{ scale: 0 }} // start from the right
                    animate={{ scale: 1 }} // animate to the left
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="mt-10 flex space-x-4 motion-preset-slide-up">
                    <a href="#download" className="cta-button inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-8 shadow-lg">
                      Get Started
                    </a>
                    <a href="#how-it-works" className="cta-button inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-70 hover:bg-opacity-80 md:py-4 md:text-lg md:px-8">
                      How It Works
                    </a>
                  </motion.button>
                </div>
              </div>
              <div className="mt-12 lg:mt-0 lg:col-span-6">
              </div>
            </div>
          </div>
        </div>

        {/* <div className="feature-card feature-card-bg rounded-lg shadow-md p-6 border border-gray-100 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-500"> */}
        {/* <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full"> */}
        {/* Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-200 sm:text-4xl">
                Everything you need to build a stronger community
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                NeighbourLink makes it easy to connect with your neighbors and share resources.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="feature-card feature-card-bg bg-white rounded-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px_rgb(255,255,255,0.3)]
                  p-6 border dark:border-neutral-800 border-gray-100 dark:hover:border-neutral-600 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-10000 ease-in-out">
                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full">
                  <img src="/assets/resource_sharing.png" className='' alt="" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Resource Sharing</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Share underutilized items like tools, medical equipment, or books with trusted neighbors.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card feature-card-bg bg-white rounded-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px_rgb(255,255,255,0.3)]
                  p-6 border dark:border-neutral-800 border-gray-100 dark:hover:border-neutral-600 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-10000 ease-in-out">
                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full">
                  <img src="/assets/emergency_alert.png" className='' alt="" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Emergency Alerts</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Broadcast urgent needs to neighbors within a 2km radius via push notifications and SMS.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card feature-card-bg bg-white rounded-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px_rgb(255,255,255,0.3)]
                  p-6 border dark:border-neutral-800 border-gray-100 dark:hover:border-neutral-600 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-10000 ease-in-out">
                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full">
                  <img src="/assets/secure_communication.png" className='' alt="" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Secure Communication</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Chat privately with neighbors using our end-to-end encrypted messaging system.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-card feature-card-bg bg-white rounded-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px_rgb(255,255,255,0.3)]
                  p-6 border dark:border-neutral-800 border-gray-100 dark:hover:border-neutral-600 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-10000 ease-in-out">
                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full">
                  <img src="/assets/trust_building.png" className='' alt="" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Trust Building</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Earn "Trusted Neighbor" badges through ID verification and positive community interactions.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="feature-card feature-card-bg bg-white rounded-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px_rgb(255,255,255,0.3)]
                  p-6 border dark:border-neutral-800 border-gray-100 dark:hover:border-neutral-600 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-10000 ease-in-out">
                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full ">
                  <img src="/assets/hyperlocal_focus.png" className='' alt="" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Hyperlocal Focus</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect with neighbors within 1-5km radius, creating a truly local community network.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="feature-card feature-card-bg bg-white rounded-lg shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px_rgb(255,255,255,0.3)]
                  p-6 border dark:border-neutral-800 border-gray-100 dark:hover:border-neutral-600 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-10000 ease-in-out">
                <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full ">
                  <img src="/assets/safety_privacy.png" className='' alt="" />

                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">Safety & Privacy</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Coordinate safe pickup locations and maintain privacy with anonymous posting options.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* </div> */}
        {/* </div> */}

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-100 sm:text-4xl">
                How NeighbourLink Works
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
                Building community connections has never been easier
              </p>
            </div>

            <div className="mt-16">
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-700">
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-gray-300">Sign Up & Verify</h3>
                  <p className="mt-5 text-base font-light text-gray-100">
                    Create an account using your phone number or email, then verify your identity to earn a "Trusted Neighbor" badge.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="mt-10 lg:mt-0 text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-700">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-gray-300">Post & Search</h3>
                  <p className="mt-5 text-base font-light text-gray-100">
                    Post requests or offers for resources, or search for items you need within your neighborhood radius (1-5km customizable).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="mt-10 lg:mt-0 text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-700">
                    <span className="text-2xl font-bold">3</span>
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-gray-300">Connect & Share</h3>
                  <p className="mt-5 text-base font-light text-gray-100">
                    Communicate through secure messaging, arrange meetups at safe locations, and start building relationships with your neighbors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-neutral-50 dark:bg-neutral-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-400 sm:text-4xl">
                What Our Users Are Saying
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Real stories from people using NeighbourLink to build stronger communities
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Testimonial 1 */}
              <div className="bg-neutral-50 dark:bg-slate-800 rounded-xl shadow-md overflow-hidden p-6 border dark:border-slate-600 border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-semibold text-gray-500">JS</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Jennifer S.</h4>
                    <p className="text-gray-500 text-sm">Oakland, CA</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
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
              <div className="bg-neutral-50 dark:bg-slate-800 rounded-xl shadow-md overflow-hidden p-6 border dark:border-slate-600 border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-semibold text-gray-500">MR</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Michael R.</h4>
                    <p className="text-gray-500 text-sm">Austin, TX</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
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
              <div className="bg-neutral-50 dark:bg-slate-800 rounded-xl shadow-md overflow-hidden p-6 border dark:border-gray-600 border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-semibold text-gray-500">AP</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Alicia P.</h4>
                    <p className="text-gray-500 text-sm">Chicago, IL</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
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
        <section id="download" className="py-20 download-section-bg text-white">
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
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-7.37 10c0-.8.13-1.58.38-2.31L9.88 14.5v.01l2.06 2.05-6.95 4.04A7.976 7.976 0 0 1 4.63 12zm3.08-6.55L6.59 9.12l2.04 2.04L10.15 13l-3.58 2.07 7.73-4.5L7.71 5.45zM12 4a7.95 7.95 0 0 1 4.75 1.58L11.4 9.39 6.92 12 12 14.92l5.23-3.05-2.55 4.02L12.38 20h-.76c-4.4-.01-7.92-3.54-7.93-7.94 0-4.4 3.53-7.94 7.93-7.95h.38l.05-.06L12 4zm8 8c0 2.8-1.45 5.27-3.63 6.71L13.5 12l2.88-4.53A7.96 7.96 0 0 1 20 12z" />
                </svg>
                Play Store
              </a>
              <a href="#" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg transition duration-300 transform hover:-translate-y-1">
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.462 8.293a4.144 4.144 0 0 0-.985-1.049 4.08 4.08 0 0 0-5.166.351 4.133 4.133 0 0 0-.913 1.287 4.151 4.151 0 0 0-.913-1.287 4.08 4.08 0 0 0-5.166-.351 4.144 4.144 0 0 0-.985 1.049 4.151 4.151 0 0 0 .228 5.288l5.345 5.35c.8.8 2.093.81 2.981 0l5.345-5.35a4.151 4.151 0 0 0 .229-5.288z" />
                </svg>
                App Store
              </a>
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
    </>
  );
};

export default LandingPage;
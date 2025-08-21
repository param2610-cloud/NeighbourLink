import { useEffect, useState, useRef } from 'react';
import './LandingPage.css';
import { motion, useInView } from 'framer-motion';
import { auth } from '@/firebase';
import '@fortawesome/fontawesome-svg-core/styles.css';
import TextType from '../ui/TextType';

const LandingPage = () => {

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  // carousel images (using public assets present in the project)
  const carouselImages = [
    '/assets/courosel1.jpg',
    '/assets/courosel2.jpeg',
    '/assets/courosel3.jpg',
    '/assets/courosel4.jpg',
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>();

  // Animation refs and inView hooks
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const downloadRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 });
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.1 });
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.1 });
  const downloadInView = useInView(downloadRef, { once: true, amount: 0.1 });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in-view');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Enhanced selector for better animation coverage
    document.querySelectorAll('.animate-on-scroll, .feature-card, .testimonial-card').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // capture current as previous, then advance current index
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % carouselImages.length;
      });
    }, 8000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* Background carousel (cross-fades using framer-motion) */}
      <div className='h-screen w-full fixed top-0 left-0' style={{ zIndex: -1 }}>
        {/* current image (below) */}
        <img
          src={carouselImages[currentIndex]}
          alt={`carousel-${currentIndex}`}
          className='h-full w-full object-cover'
          style={{ filter: 'brightness(0.5) contrast(1.2)' }}
        />

        {/* previous image (on top) fades out to reveal current image underneath */}
        {prevIndex !== null && (
          <motion.img
            key={`prev-${prevIndex}`}
            src={carouselImages[prevIndex]}
            alt={`carousel-prev-${prevIndex}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
            className='h-full w-full object-cover absolute top-0 left-0'
            style={{ filter: 'brightness(0.5) contrast(1.2)' }}
            onAnimationComplete={() => setPrevIndex(null)}
          />
        )}
      </div>
      <div className="landing-page absolute top-0 left-0">
        {/* Navigation */}
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/10 dark:bg-neutral-800/10 backdrop-blur-lg border-b border-white/20 dark:border-white/10 shadow-lg fixed w-full z-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold text-indigo-500 dark:text-indigo-400" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)' }}>Neighbour<span className="text-purple-500 dark:text-purple-400" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)' }}>Link</span></span>
                </div>
              </div>
              <div className="hidden md:flex items-center font-extrabold  space-x-8">
                <a href="#features" className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg">Features</a>
                <a href="#how-it-works" className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg">How It Works</a>
                <a href="#testimonials" className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg">Testimonials</a>
                <a href="#download" className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg">Download</a>
              </div>


              <div className="flex items-center">
                {
                  user ?
                    <a href="/" className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300">DashBoard</a>
                    :
                    <a href="login" className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300">Sign In</a>
                }
                {/* Uncomment and fix mobile menu button */}
                <button className="md:hidden p-2 rounded-md text-white/90 hover:text-white focus:outline-none"
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
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/10 dark:bg-neutral-800/10 backdrop-blur-lg border-t border-white/20">
                <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300">Features</a>
                <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300">How It Works</a>
                <a href="#testimonials" className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300">Testimonials</a>
                <a href="#download" className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300">Download</a>
                {!user && (
                  <>
                    <a href="/register" className="block w-full text-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300">Sign Up</a>
                    <a href="/login" className="block w-full text-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300">Sign In</a>
                  </>
                )}
                {user && (
                  <a href="/" className="block w-full text-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300">Profile</a>
                )}
              </div>
            </motion.div>
          )}
        </motion.nav>


        {/* Hero Section */}
        <motion.div 
          ref={heroRef}
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
          variants={staggerContainer}
          id="hero" 
          className={`w-full bg-property relative pt-20 pb-32 overflow-hidden`}
        >
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-6">
                <div className="mt-12 lg:mt-24">
                  <motion.div
                    variants={fadeInUp}
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
                  >
                    Connect with your neighbors like never before
                  </motion.div>
                  <motion.div
                    variants={staggerItem}
                  >
                    <TextType
                      text={["NeighbourLink is a hyperlocal platform that helps you share resources,", "find urgent assistance,", "and build a stronger community—all within your neighborhood."]}
                      typingSpeed={75}
                      pauseDuration={1500}
                      showCursor={true}
                      cursorCharacter="|"
                      className='mt-6 text-xl text-indigo-100'
                    />
                  </motion.div>
                  <motion.div
                    variants={staggerItem}
                    className="mt-10 flex space-x-4"
                  >
                    <motion.a 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href="#download" 
                      className="cta-button inline-flex items-center justify-center px-6 py-3 border border-white/30 text-base font-medium rounded-xl text-white bg-white/10 backdrop-blur-md hover:bg-white/20 md:py-4 md:text-lg md:px-8 shadow-lg transition duration-300"
                    >
                      Get Started
                    </motion.a>
                    <motion.a 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href="#how-it-works" 
                      className="cta-button inline-flex items-center justify-center px-6 py-3 border border-indigo-300/30 text-base font-medium rounded-xl text-white bg-indigo-500/20 backdrop-blur-md hover:bg-indigo-500/30 md:py-4 md:text-lg md:px-8 shadow-lg transition duration-300"
                    >
                      How It Works
                    </motion.a>
                  </motion.div>
                </div>
              </div>
              <div className="mt-12 lg:mt-0 lg:col-span-6">
              </div>
            </div>
          </div>
        </motion.div>

        {/* <div className="feature-card feature-card-bg rounded-lg shadow-md p-6 border border-gray-100 animate-on-scroll opacity-0 transform translate-y-10 transition-all duration-500"> */}
        {/* <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full"> */}
        {/* Features Section */}
        <motion.section 
          ref={featuresRef}
          id="features" 
          initial="hidden"
          animate={featuresInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="py-20 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl drop-shadow-lg">
                Everything you need to build a stronger community
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-white/80 drop-shadow-md">
                NeighbourLink makes it easy to connect with your neighbors and share resources.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {/* Feature 1 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="feature-card bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30
                  p-6 hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.div 
                  variants={scaleIn}
                  className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <img src="/assets/resource_sharing.png" className='' alt="" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Resource Sharing</h3>
                <p className="text-white/80 drop-shadow-sm">
                  Share underutilized items like tools, medical equipment, or books with trusted neighbors.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="feature-card bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30
                  p-6 hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.div 
                  variants={scaleIn}
                  className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <img src="/assets/emergency_alert.png" className='' alt="" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Emergency Alerts</h3>
                <p className="text-white/80 drop-shadow-sm">
                  Broadcast urgent needs to neighbors within a 2km radius via push notifications and SMS.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="feature-card bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30
                  p-6 hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.div 
                  variants={scaleIn}
                  className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <img src="/assets/secure_communication.png" className='' alt="" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Secure Communication</h3>
                <p className="text-white/80 drop-shadow-sm">
                  Chat privately with neighbors using our end-to-end encrypted messaging system.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="feature-card bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30
                  p-6 hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.div 
                  variants={scaleIn}
                  className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <img src="/assets/trust_building.png" className='' alt="" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Trust Building</h3>
                <p className="text-white/80 drop-shadow-sm">
                  Earn "Trusted Neighbor" badges through ID verification and positive community interactions.
                </p>
              </motion.div>

              {/* Feature 5 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="feature-card bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30
                  p-6 hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.div 
                  variants={scaleIn}
                  className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <img src="/assets/hyperlocal_focus.png" className='' alt="" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Hyperlocal Focus</h3>
                <p className="text-white/80 drop-shadow-sm">
                  Connect with neighbors within 1-5km radius, creating a truly local community network.
                </p>
              </motion.div>

              {/* Feature 6 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="feature-card bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30
                  p-6 hover:bg-white/15 transition-all duration-300 ease-in-out"
              >
                <motion.div 
                  variants={scaleIn}
                  className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <img src="/assets/safety_privacy.png" className='' alt="" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-md">Safety & Privacy</h3>
                <p className="text-white/80 drop-shadow-sm">
                  Coordinate safe pickup locations and maintain privacy with anonymous posting options.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
        {/* </div> */}
        {/* </div> */}

        {/* How It Works Section */}
        <motion.section 
          ref={howItWorksRef}
          initial="hidden"
          animate={howItWorksInView ? "visible" : "hidden"}
          variants={staggerContainer}
          id="how-it-works" 
          className="py-20 bg-gradient-to-b from-transparent to-black/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl drop-shadow-lg">
                How NeighbourLink Works
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-white/80 drop-shadow-md">
                Building community connections has never been easier
              </p>
            </motion.div>

            <div className="mt-16">
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                {/* Step 1 */}
                <motion.div variants={staggerItem} className="text-center">
                  <motion.div 
                    variants={scaleIn}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg"
                  >
                    <span className="text-2xl font-bold drop-shadow-lg">1</span>
                  </motion.div>
                  <h3 className="mt-8 text-lg font-bold text-white drop-shadow-md">Sign Up & Verify</h3>
                  <p className="mt-5 text-base font-light text-white/80 drop-shadow-sm">
                    Create an account using your phone number or email, then verify your identity to earn a "Trusted Neighbor" badge.
                  </p>
                </motion.div>

                {/* Step 2 */}
                <motion.div variants={staggerItem} className="mt-10 lg:mt-0 text-center">
                  <motion.div 
                    variants={scaleIn}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg"
                  >
                    <span className="text-2xl font-bold drop-shadow-lg">2</span>
                  </motion.div>
                  <h3 className="mt-8 text-lg font-bold text-white drop-shadow-md">Post & Search</h3>
                  <p className="mt-5 text-base font-light text-white/80 drop-shadow-sm">
                    Post requests or offers for resources, or search for items you need within your neighborhood radius (1-5km customizable).
                  </p>
                </motion.div>

                {/* Step 3 */}
                <motion.div variants={staggerItem} className="mt-10 lg:mt-0 text-center">
                  <motion.div 
                    variants={scaleIn}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg"
                  >
                    <span className="text-2xl font-bold drop-shadow-lg">3</span>
                  </motion.div>
                  <h3 className="mt-8 text-lg font-bold text-white drop-shadow-md">Connect & Share</h3>
                  <p className="mt-5 text-base font-light text-white/80 drop-shadow-sm">
                    Communicate through secure messaging, arrange meetups at safe locations, and start building relationships with your neighbors.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section 
          ref={testimonialsRef}
          initial="hidden"
          animate={testimonialsInView ? "visible" : "hidden"}
          variants={staggerContainer}
          id="testimonials" 
          className="py-20 bg-gradient-to-b from-black/10 to-black/20 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl drop-shadow-lg">
                What Our Users Are Saying
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-white/80 drop-shadow-md">
                Real stories from people using NeighbourLink to build stronger communities
              </p>
            </motion.div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Testimonial 1 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30 hover:bg-white/15 p-6 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <motion.div 
                    variants={scaleIn}
                    className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
                  >
                    <span className="text-xl font-semibold text-white drop-shadow-md">JS</span>
                  </motion.div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-white drop-shadow-md">Jennifer S.</h4>
                    <p className="text-white/70 text-sm drop-shadow-sm">Oakland, CA</p>
                  </div>
                </div>
                <p className="text-white/80 italic drop-shadow-sm">
                  "When my son needed crutches after a sports injury, I posted an urgent request on NeighbourLink. Within 30 minutes, a neighbor three blocks away offered to lend us a pair. We saved hundreds of dollars and made a new friend!"
                </p>
                <div className="mt-4 flex text-yellow-400 drop-shadow-sm">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </motion.div>

              {/* Testimonial 2 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30 hover:bg-white/15 p-6 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <motion.div 
                    variants={scaleIn}
                    className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
                  >
                    <span className="text-xl font-semibold text-white drop-shadow-md">MR</span>
                  </motion.div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-white drop-shadow-md">Michael R.</h4>
                    <p className="text-white/70 text-sm drop-shadow-sm">Austin, TX</p>
                  </div>
                </div>
                <p className="text-white/80 italic drop-shadow-sm">
                  "During the last power outage, NeighbourLink's emergency alert system helped our street coordinate sharing generators and refrigerator space. It turned a stressful situation into a block party!"
                </p>
                <div className="mt-4 flex text-yellow-400 drop-shadow-sm">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
              </motion.div>

              {/* Testimonial 3 */}
              <motion.div 
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 hover:border-white/30 hover:bg-white/15 p-6 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <motion.div 
                    variants={scaleIn}
                    className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
                  >
                    <span className="text-xl font-semibold text-white drop-shadow-md">AP</span>
                  </motion.div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-white drop-shadow-md">Alicia P.</h4>
                    <p className="text-white/70 text-sm drop-shadow-sm">Chicago, IL</p>
                  </div>
                </div>
                <p className="text-white/80 italic drop-shadow-sm">
                  "As a new mom working from home, I felt isolated until I found NeighbourLink. I've borrowed baby equipment, found a babysitting swap, and finally feel connected to my neighborhood after living here for years."
                </p>
                <div className="mt-4 flex text-yellow-400 drop-shadow-sm">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Download Section */}
        <motion.section 
          ref={downloadRef}
          initial="hidden"
          animate={downloadInView ? "visible" : "hidden"}
          variants={staggerContainer}
          id="download" 
          className="py-20 bg-gradient-to-b from-black/20 to-black/40 backdrop-blur-lg text-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 variants={fadeInUp} className="text-3xl font-extrabold sm:text-4xl drop-shadow-lg">
              Ready to connect with your community?
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 max-w-2xl mx-auto text-xl text-white/80 drop-shadow-md">
              Download NeighbourLink today and start building relationships with your neighbors.
            </motion.p>

            <motion.div variants={staggerContainer} className="mt-10 flex flex-wrap justify-center gap-6">
              <motion.a 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                href="#" 
                className="inline-flex items-center px-6 py-3 border border-white/30 text-base font-medium rounded-2xl text-white bg-white/10 backdrop-blur-md hover:bg-white/20 shadow-lg transition duration-300 transform hover:-translate-y-1"
              >
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-7.37 10c0-.8.13-1.58.38-2.31L9.88 14.5v.01l2.06 2.05-6.95 4.04A7.976 7.976 0 0 1 4.63 12zm3.08-6.55L6.59 9.12l2.04 2.04L10.15 13l-3.58 2.07 7.73-4.5L7.71 5.45zM12 4a7.95 7.95 0 0 1 4.75 1.58L11.4 9.39 6.92 12 12 14.92l5.23-3.05-2.55 4.02L12.38 20h-.76c-4.4-.01-7.92-3.54-7.93-7.94 0-4.4 3.53-7.94 7.93-7.95h.38l.05-.06L12 4zm8 8c0 2.8-1.45 5.27-3.63 6.71L13.5 12l2.88-4.53A7.96 7.96 0 0 1 20 12z" />
                </svg>
                Play Store
              </motion.a>
              <motion.a 
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                href="#" 
                className="inline-flex items-center px-6 py-3 border border-white/30 text-base font-medium rounded-2xl text-white bg-white/10 backdrop-blur-md hover:bg-white/20 shadow-lg transition duration-300 transform hover:-translate-y-1"
              >
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.462 8.293a4.144 4.144 0 0 0-.985-1.049 4.08 4.08 0 0 0-5.166.351 4.133 4.133 0 0 0-.913 1.287 4.151 4.151 0 0 0-.913-1.287 4.08 4.08 0 0 0-5.166-.351 4.144 4.144 0 0 0-.985 1.049 4.151 4.151 0 0 0 .228 5.288l5.345 5.35c.8.8 2.093.81 2.981 0l5.345-5.35a4.151 4.151 0 0 0 .229-5.288z" />
                </svg>
                App Store
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 text-white py-12">
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
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";

interface GuidelineSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  rules: string[];
  examples?: {
    do: string[];
    dont: string[];
  };
}

interface ReportingStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

const CommunityGuides: React.FC = () => {

    const navigate = useNavigate();
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Background carousel
  const backgroundImages = [
    "/assets/courosel1.jpg",
    "/assets/courosel2.jpeg",
    "/assets/courosel3.jpg",
    "/assets/courosel4.jpg",
  ];

  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState<number | null>(null);

  // Animation refs
  const heroRef = useRef(null);
  const principlesRef = useRef(null);
  const guidelinesRef = useRef(null);
  const enforcementRef = useRef(null);
  const reportingRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const principlesInView = useInView(principlesRef, {
    once: true,
    amount: 0.1,
  });
  const guidelinesInView = useInView(guidelinesRef, {
    once: true,
    amount: 0.1,
  });
  const enforcementInView = useInView(enforcementRef, {
    once: true,
    amount: 0.1,
  });
  const reportingInView = useInView(reportingRef, { once: true, amount: 0.1 });

  // Guidelines data
  const guidelinesSections: GuidelineSection[] = [
    
    {
      id: "verification-trust",
      title: "Verification & Trust",
      icon: "✅",
      description: "Building and maintaining community trust",
      rules: [
        "Complete your profile verification to earn trust badges",
        "Use Govt. ID cards to get Verified",
        "Be honest about your identity and neighborhood location",
        "Leave honest feedback after interactions",
        "Report fake accounts or suspicious behavior",
        "Protect your personal information appropriately",
      ],
      examples: {
        do: [
          "Upload a clear Registered ID photo and verify Yourself",
          "Rate interactions honestly and constructively",
          "Ask for verification badges before high-value exchanges",
        ],
        dont: [
          "Create multiple accounts or fake profiles",
          "Share your home address until you trust the neighbor",
          "Leave false or vindictive reviews",
        ],
      },
    },
    {
      id: "respect-safety",
      title: "Respect & Safety",
      icon: "🛡️",
      description: "Creating a safe, respectful environment for all neighbors",
      rules: [
        "Treat all community members with respect and kindness",
        "No harassment, bullying, or discriminatory behavior",
        "Respect privacy and personal boundaries",
        "Use appropriate language in all communications",
        "Report suspicious or unsafe behavior immediately",
      ],
      examples: {
        do: [
          "Use polite, friendly language when messaging neighbors",
          "Respect 'no' as an answer without pressuring",
          "Meet in public, well-lit areas for exchanges",
        ],
        dont: [
          "Share personal contact information publicly",
          "Make requests based on assumptions about neighbors",
          "Continue messaging if someone doesn't respond",
        ],
      },
    },
    {
      id: "resource-sharing",
      title: "Resource Sharing",
      icon: "🤝",
      description: "Guidelines for fair and responsible resource sharing",
      rules: [
        "Only offer items you actually own and can share",
        "Provide accurate descriptions and condition of items",
        "Return borrowed items in the same condition",
        "Respect agreed-upon timeframes for borrowing",
        "No selling or commercial transactions",
      ],
      examples: {
        do: [
          "Clean items before lending or returning them",
          "Send a photo when requesting to borrow something specific",
          "Offer alternative dates if your preferred time doesn't work",
        ],
        dont: [
          "Request expensive items without building trust first",
          "Keep borrowed items longer than agreed",
          "Use the platform to run a business or sell items",
        ],
      },
    },
    {
      id: "communication",
      title: "Communication",
      icon: "💬",
      description: "Guidelines for messaging and community interaction",
      rules: [
        "Keep conversations relevant to the request or offer",
        "Respond promptly to direct messages when possible",
        "Use clear, specific language in posts and messages",
        "Respect others' time and availability",
        "No spam, promotional content, or repetitive posts",
      ],
      examples: {
        do: [
          "Include specific details about timing and location",
          "Thank neighbors who help or offer assistance",
          "Update your post when an item is no longer available",
        ],
        dont: [
          "Send multiple messages if someone doesn't respond immediately",
          "Post the same request multiple times in a short period",
          "Share unrelated personal information or gossip",
        ],
      },
    }
  ];

  const reportingSteps: ReportingStep[] = [
    {
      step: 1,
      title: "Identify the Issue",
      description:
        "Determine if the behavior violates our community guidelines",
      icon: "🔍",
    },
    {
      step: 2,
      title: "Document Evidence",
      description: "Take screenshots of messages or inappropriate behavior",
      icon: "📸",
    },
    {
      step: 3,
      title: "Submit Report",
      description:
        "Use the in-app reporting feature or contact our support team",
      icon: "📋",
    },
    {
      step: 4,
      title: "Follow Up",
      description:
        "We'll investigate within 24-48 hours and take appropriate action",
      icon: "⏱️",
    },
  ];

  // Background carousel effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentBgIndex((prev) => {
        setPrevBgIndex(prev);
        return (prev + 1) % backgroundImages.length;
      });   
    }, 8000);
    return () => clearInterval(intervalId);
  }, [backgroundImages.length]);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background carousel */}
      <div className="fixed top-0 left-0 h-full w-full" style={{ zIndex: -1 }}>
        <img
          src={backgroundImages[currentBgIndex]}
          alt={`background-${currentBgIndex}`}
          className="h-full w-full object-cover"
          style={{ filter: "brightness(0.4) contrast(1.2)" }}
        />
        {prevBgIndex !== null && (
          <motion.img
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="h-full w-full object-cover absolute top-0 left-0"
            style={{ filter: "brightness(0.2) contrast(1.2)" }}
            onAnimationComplete={() => setPrevBgIndex(null)}
          />
        )}
      </div>

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
                <span
                  className="text-2xl font-bold text-indigo-500 dark:text-indigo-400"
                  style={{
                    textShadow:
                      "0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)",
                  }}
                >
                  Neighbour
                  <span
                    className="text-purple-500 dark:text-purple-400"
                    style={{
                      textShadow:
                        "0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)",
                    }}
                  >
                    Link
                  </span>
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center font-extrabold  space-x-8">
              <a
                onClick={() => navigate("/")}
                style={{ cursor: "pointer" }}
                className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg"
              >
                Home
              </a>
              <a
                onClick={() => navigate("/about")}
                style={{ cursor: "pointer" }}
                className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg"
              >
                About US
              </a>
              <a
                onClick={() => navigate("/community-guides")}
                style={{ cursor: "pointer" }}
                className="text-white/90 hover:text-white transition duration-300 hover:drop-shadow-lg"
              >
                Community Guidelines
              </a>
            </div>

            <div className="flex items-center">
              {user ? (
                <a
                  href="/"
                  className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300"
                >
                  DashBoard
                </a>
              ) : (
                <a
                  href="login"
                  className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300"
                >
                  Sign In
                </a>
              )}
              {/* Uncomment and fix mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-white/90 hover:text-white focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/10 dark:bg-neutral-800/10 backdrop-blur-lg border-t border-white/20">
              <a
                href="#features"
                className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300"
              >
                Testimonials
              </a>
              <a
                href="#download"
                className="block px-3 py-2 rounded-md text-base font-medium text-white/90 hover:bg-white/10 hover:text-white transition duration-300"
              >
                Download
              </a>
              {!user && (
                <>
                  <a
                    href="/register"
                    className="block w-full text-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300"
                  >
                    Sign Up
                  </a>
                  <a
                    href="/login"
                    className="block w-full text-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300"
                  >
                    Sign In
                  </a>
                </>
              )}
              {user && (
                <a
                  href="/"
                  className="block w-full text-center px-4 py-2 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition duration-300"
                >
                  Profile
                </a>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="pt-24 pb-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ textShadow: "0 4px 12px rgba(0,0,0,0.8)" }}
          >
            Community <span className="text-indigo-400">Guidelines</span>
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
          >
            Building safer, stronger neighborhoods together through respect,
            trust, and community care.
          </motion.p>
        </div>
      </motion.section>

      {/* Core Principles */}
      <motion.section
        ref={principlesRef}
        initial="hidden"
        animate={principlesInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">
              Our Core Principles
            </h2>
            <p className="text-xl text-white/80 drop-shadow-sm max-w-3xl mx-auto">
              These fundamental values guide all interactions on NeighbourLink
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-2xl font-semibold mb-4 drop-shadow-md">
                Mutual Respect
              </h3>
              <p className="text-white/80 leading-relaxed drop-shadow-sm">
                Every neighbor deserves courtesy, understanding, and dignified
                treatment regardless of background or circumstances.
              </p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold mb-4 drop-shadow-md">
                Safety First
              </h3>
              <p className="text-white/80 leading-relaxed drop-shadow-sm">
                Personal safety and security are paramount in all community
                interactions and resource sharing activities.
              </p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-2xl font-semibold mb-4 drop-shadow-md">
                Community Care
              </h3>
              <p className="text-white/80 leading-relaxed drop-shadow-sm">
                We support each other through genuine helpfulness, generosity,
                and building lasting neighborhood connections.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Guidelines Sections */}
      <motion.section
        ref={guidelinesRef}
        initial="hidden"
        animate={guidelinesInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {guidelinesSections.map((section) => (
            <motion.div
              key={section.id}
              id={section.id}
              variants={staggerItem}
              className="mb-20"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <span className="text-4xl mr-4">{section.icon}</span>
                    <div>
                      <h3 className="text-3xl font-bold drop-shadow-md">
                        {section.title}
                      </h3>
                      <p className="text-white/80 mt-2 drop-shadow-sm">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xl font-semibold mb-4 text-indigo-300 drop-shadow-md">
                        Guidelines
                      </h4>
                      <ul className="space-y-3">
                        {section.rules.map((rule, ruleIndex) => (
                          <li key={ruleIndex} className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1 flex-shrink-0">
                              ✓
                            </span>
                            <span className="text-white/90 drop-shadow-sm">
                              {rule}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {section.examples && (
                      <div className="space-y-6">
                        <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-400/20">
                          <h5 className="text-lg font-semibold text-green-300 mb-3 drop-shadow-md">
                            ✅ Do
                          </h5>
                          <ul className="space-y-2">
                            {section.examples.do.map((item, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="text-white/80 text-sm drop-shadow-sm"
                              >
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-400/20">
                          <h5 className="text-lg font-semibold text-red-300 mb-3 drop-shadow-md">
                            ❌ Don't
                          </h5>
                          <ul className="space-y-2">
                            {section.examples.dont.map((item, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="text-white/80 text-sm drop-shadow-sm"
                              >
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Enforcement Section */}
      <motion.section
        ref={enforcementRef}
        initial="hidden"
        animate={enforcementInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20 bg-gradient-to-b from-transparent to-black/10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">
              Enforcement & Consequences
            </h2>
            <p className="text-xl text-white/80 drop-shadow-sm max-w-3xl mx-auto">
              We take violations seriously to maintain a safe community for
              everyone
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-semibold mb-6 text-orange-300 drop-shadow-md">
                Warning System
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="bg-yellow-500/20 text-yellow-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-white drop-shadow-sm">
                      First Warning
                    </h4>
                    <p className="text-white/80 text-sm drop-shadow-sm">
                      Educational notice about guideline violations
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-orange-500/20 text-orange-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-white drop-shadow-sm">
                      Final Warning
                    </h4>
                    <p className="text-white/80 text-sm drop-shadow-sm">
                      Formal warning with account review
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="bg-red-500/20 text-red-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-white drop-shadow-sm">
                      Suspension/Ban
                    </h4>
                    <p className="text-white/80 text-sm drop-shadow-sm">
                      Temporary or permanent account removal
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-semibold mb-6 text-red-300 drop-shadow-md">
                Serious Violations
              </h3>
              <p className="text-white/80 mb-4 drop-shadow-sm">
                The following behaviors may result in immediate account
                suspension:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-red-400 mr-3 mt-1">⚠️</span>
                  <span className="text-white/90 text-sm drop-shadow-sm">
                    Harassment, threats, or abusive behavior
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-3 mt-1">⚠️</span>
                  <span className="text-white/90 text-sm drop-shadow-sm">
                    Fraudulent activity or identity theft
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-3 mt-1">⚠️</span>
                  <span className="text-white/90 text-sm drop-shadow-sm">
                    False emergency alerts or hoax reports
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-3 mt-1">⚠️</span>
                  <span className="text-white/90 text-sm drop-shadow-sm">
                    Sharing inappropriate or illegal content
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-3 mt-1">⚠️</span>
                  <span className="text-white/90 text-sm drop-shadow-sm">
                    Repeated violations after warnings
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Reporting Section */}
      <motion.section
        ref={reportingRef}
        initial="hidden"
        animate={reportingInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20 bg-gradient-to-b from-black/10 to-black/20 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">
              How to Report Violations
            </h2>
            <p className="text-xl text-white/80 drop-shadow-sm max-w-3xl mx-auto">
              Help us keep the community safe by reporting inappropriate
              behavior
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {reportingSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="bg-indigo-500/20 text-indigo-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 drop-shadow-md">
                  {step.title}
                </h3>
                <p className="text-white/80 text-sm drop-shadow-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={staggerItem}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center"
          >
            <h3 className="text-2xl font-semibold mb-4 drop-shadow-md">
              Need Help?
            </h3>
            <p className="text-white/80 mb-6 drop-shadow-sm">
              Contact our community safety team for assistance with reporting or
              questions about guidelines
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:safety@neighbourlink.com"
                className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                📧 safety@neighbourlink.com
              </a>
              <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-1">
                💬 In-App Support
              </button>
            </div>
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
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    <span className="sr-only">Facebook</span>
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    <span className="sr-only">Twitter</span>
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition duration-300"
                  >
                    <span className="sr-only">Instagram</span>
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      className="text-gray-400 hover:text-white transition duration-300"
                      onClick={() => navigate("/about")}
                      style={{ cursor: "pointer" }}
                    >
                      About Us
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      className="text-gray-400 hover:text-white transition duration-300"
                      onClick={() => navigate("/community-guides")}
                      style={{ cursor: "pointer" }}
                    >
                      Community Guidelines
                    </a>
                  </li>
                </ul>
              </div>

              
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>
                &copy; {new Date().getFullYear()} NeighbourLink. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
    </div>
  );
};
export default CommunityGuides;
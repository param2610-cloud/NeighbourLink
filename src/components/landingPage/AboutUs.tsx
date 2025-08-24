import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  initials: string;
}

const AboutUs: React.FC = () => {
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

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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

  // Background carousel images
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
  const missionRef = useRef(null);
  const storyRef = useRef(null);
  const teamRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const valuesRef = useRef(null);
  const [user, setUser] = useState<any>();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const missionInView = useInView(missionRef, { once: true, amount: 0.1 });
  const storyInView = useInView(storyRef, { once: true, amount: 0.1 });
  const teamInView = useInView(teamRef, { once: true, amount: 0.1 });
  const valuesInView = useInView(valuesRef, { once: true, amount: 0.1 });

  // Sample team data
  const teamMembers: TeamMember[] = [
    {
      name: "Parambrata Ghosh",
      role: "Co-Founder & CEO",
      bio: "Former community organizer with 10+ years experience in neighborhood engagement and social impact initiatives.",
      image: "/assets/team-member-1.jpg",
      initials: "PG",
    },
    {
      name: "Shramana Show",
      role: "Co-Founder & CTO",
      bio: "Tech entrepreneur passionate about building platforms that connect people and strengthen communities.",
      image: "/assets/team-member-2.jpg",
      initials: "SS",
    },
    {
      name: "Parthib Panja",
      role: "Head of Community",
      bio: "Social worker turned community builder, focused on creating safe and inclusive neighborhood networks.",
      image: "/assets/team-member-3.jpg",
      initials: "PP",
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
          style={{ filter: "brightness(0.3) contrast(1.1)" }}
        />
        {prevBgIndex !== null && (
          <motion.img
            key={`prev-bg-${prevBgIndex}`}
            src={backgroundImages[prevBgIndex]}
            alt={`background-prev-${prevBgIndex}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="h-full w-full object-cover absolute top-0 left-0"
            style={{ filter: "brightness(0.3) contrast(1.1)" }}
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
            style={{ textShadow: "0 4px 12px rgba(0,0,0,0.7)" }}
          >
            About <span className="text-indigo-400">Neighbour</span>
            <span className="text-purple-400">Link</span>
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            We're building the future of neighborhood connections, one community
            at a time.
          </motion.p>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        ref={missionRef}
        initial="hidden"
        animate={missionInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">
                Our Mission
              </h2>
              <p className="text-lg text-white/90 mb-6 leading-relaxed drop-shadow-sm">
                NeighbourLink exists to rebuild the social fabric of communities
                by making it easier for neighbors to connect, share resources,
                and support each other in meaningful ways.
              </p>
              <p className="text-lg text-white/90 leading-relaxed drop-shadow-sm">
                We believe that strong neighborhoods create stronger cities, and
                technology should bring people together, not drive them apart.
              </p>
            </motion.div>
            <motion.div
              variants={scaleIn}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
            >
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-indigo-400 drop-shadow-lg">
                    50K+
                  </div>
                  <div className="text-white/80 text-sm drop-shadow-sm">
                    Verified Neighbors
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400 drop-shadow-lg">
                    100+
                  </div>
                  <div className="text-white/80 text-sm drop-shadow-sm">
                    Cities
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-400 drop-shadow-lg">
                    1M+
                  </div>
                  <div className="text-white/80 text-sm drop-shadow-sm">
                    Shared Resources
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400 drop-shadow-lg">
                    24/7
                  </div>
                  <div className="text-white/80 text-sm drop-shadow-sm">
                    Emergency Support
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Story Section */}
      <motion.section
        ref={storyRef}
        initial="hidden"
        animate={storyInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            variants={fadeInUp}
            className="text-4xl font-bold mb-12 drop-shadow-lg"
          >
            Our Story
          </motion.h2>
          <motion.div
            variants={staggerItem}
            className="space-y-6 text-lg leading-relaxed"
          >
            <p className="text-white/90 drop-shadow-sm">
              NeighbourLink was born during the pandemic when our founders,
              Sarah and Michael, experienced firsthand how neighbors could
              become lifelines for each other. They witnessed elderly neighbors
              sharing groceries, families lending medical equipment, and
              communities organizing mutual aid—all happening through informal
              networks and word-of-mouth.
            </p>
            <p className="text-white/90 drop-shadow-sm">
              They realized that while technology had connected us globally, it
              had failed to strengthen our most immediate and important
              relationships—those with the people living right next door.
            </p>
            <p className="text-white/90 drop-shadow-sm">
              Today, NeighbourLink is more than just an app. It's a movement to
              rebuild the village spirit in our modern neighborhoods, making it
              safe, easy, and rewarding to be a good neighbor.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section
        ref={teamRef}
        initial="hidden"
        animate={teamInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20 bg-gradient-to-b from-transparent to-black/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Meet Our Team
            </h2>
            <p className="text-xl text-white/80 drop-shadow-sm">
              Passionate individuals committed to strengthening communities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {member.initials}
                </div>
                <h3 className="text-xl font-semibold mb-1 drop-shadow-md">
                  {member.name}
                </h3>
                <p className="text-indigo-300 font-medium mb-3 drop-shadow-sm">
                  {member.role}
                </p>
                <p className="text-white/80 text-sm leading-relaxed drop-shadow-sm">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        ref={valuesRef}
        initial="hidden"
        animate={valuesInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="py-20 bg-gradient-to-b from-black/10 to-black/20 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Our Values
            </h2>
            <p className="text-xl text-white/80 drop-shadow-sm">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-2xl">
                🤝
              </div>
              <h3 className="text-xl font-semibold mb-3 drop-shadow-md">
                Trust & Safety
              </h3>
              <p className="text-white/80 drop-shadow-sm">
                We prioritize verification, privacy, and secure communication to
                create safe spaces for neighbors to connect.
              </p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-2xl">
                🌟
              </div>
              <h3 className="text-xl font-semibold mb-3 drop-shadow-md">
                Inclusivity
              </h3>
              <p className="text-white/80 drop-shadow-sm">
                Every neighbor deserves to feel welcome and valued, regardless
                of background, age, or circumstances.
              </p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-2xl">
                💡
              </div>
              <h3 className="text-xl font-semibold mb-3 drop-shadow-md">
                Innovation
              </h3>
              <p className="text-white/80 drop-shadow-sm">
                We continuously evolve our platform based on community feedback
                to better serve neighborhood needs.
              </p>
            </motion.div>
          </div>
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

export default AboutUs;

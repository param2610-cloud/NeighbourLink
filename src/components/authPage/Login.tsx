import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "../../firebase";
import { toast } from "react-toastify";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample Credential Card Component
const SampleCredentialCard = ({ 
  email, 
  password, 
  onUseCredentials,
  title 
}: { 
  email: string; 
  password: string; 
  onUseCredentials: (email: string, password: string) => void;
  title: string;
}) => {
  return (
    <motion.div 
      className="bg-white/70 from-white/95 to-white/85 p-4 rounded-md shadow-lg border border-white/30 backdrop-blur-sm"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="text-xs text-gray-600 mb-1 font-mono bg-gray-100 px-2 py-1 rounded">
        {email}
      </div>
      <div className="text-xs text-gray-600 mb-3 font-mono bg-gray-100 px-2 py-1 rounded">
        {"•".repeat(password.length)}
      </div>
      <button 
        onClick={() => onUseCredentials(email, password)}
        className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md"
      >
        Use Credentials
      </button>
    </motion.div>
  );
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate= useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in Successfully");
      navigate('/')
      toast.success("User logged in Successfully", {
        position: "top-center",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
        toast.error(error.message, {
          position: "bottom-center",
        });
      }
    }
  };

  const populateCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <>
      <div className="h-screen w-full relative overflow-hidden">
        <img src="/assets/base-img.jpg" className="h-full w-full" alt="" style={{
          filter: 'brightness(0.5) contrast(1.2)'
        }} />
      </div>
      <div className="flex items-center justify-center min-h-screen bg-transparent absolute top-0 left-0 w-full">
        <button
          className="absolute flex justify-center items-center gap-3 top-4 left-4 px-4 py-2 bg-transparent text-xl text-gray-100 font-medium focus:outline-none  hover:cursor-pointer"
          onClick={() => navigate('/')}
        >
          <FaArrowAltCircleLeft size={25} /> Back to Home
        </button>
        <div className="w-full max-w-md m-3">
          {/* Sample Credentials Section */}
          <div className="mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="grid grid-cols-2 gap-4">{/* was: grid-cols-1 md:grid-cols-2 */} 
                <SampleCredentialCard 
                  title="Demo Account"
                  email="rijupanja81@gmail.com" 
                  password="password" 
                  onUseCredentials={populateCredentials} 
                />
                <SampleCredentialCard 
                  title="Demo Account"
                  email="shramana@gmail.com" 
                  password="password" 
                  onUseCredentials={populateCredentials} 
                />
              </div>
            </motion.div>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full p-8 text-slate-800 bg-white/80 shadow-md rounded-md ">
            <motion.div
            initial={{scale:0}}
            animate={{ scale:1 }}
            transition={{ duration:0.5 }}
            >
              
              <h3 className="text-2xl font-bold mb-4 text-center motion-preset-pop">Sign In</h3>

              <div className="mb-3 motion-preset-slide-right">
                <label className="block text-sm font-medium text-gray-900">Email address</label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3 motion-preset-slide-right">
                <label className="block text-sm font-medium text-gray-900">Password</label>
                <input
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mt-6 motion-preset-slide-up">
                <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Sign In
                </button>
              </div>
              <p className="mt-4 text-lg text-center text-slate-700">
                New user ? <a href="/register" className="text-indigo-700 hover:text-indigo-500">Register Here</a>
              </p>
            </motion.div>

          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
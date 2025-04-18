import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "../../firebase";
import { toast } from "react-toastify";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate= useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // await setupFCMToken(user.user.uid)
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
        <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white/60 shadow-md rounded ">
          <motion.div
          initial={{scale:0}}
          animate={{ scale:1 }}
          transition={{ duration:0.5 }}
          >
            
            <h3 className="text-2xl font-bold mb-4 text-center motion-preset-pop">Login / Sign In</h3>

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
                Submit
              </button>
            </div>
            <p className="mt-4 text-lg text-center text-white">
              New user ? <a href="/register" className="text-indigo-700 hover:text-indigo-500">Register Here</a>
            </p>
          </motion.div>

        </form>
      </div>
    </>
  );
}

export default Login;
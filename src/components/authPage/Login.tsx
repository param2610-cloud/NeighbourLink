import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "../../firebase";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in Successfully");
      window.location.href = "/profile";
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <button
        className="absolute top-4 left-4 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={() => (window.location.href = "/")}
    >
        Back to Home
    </button>
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-white shadow-md rounded">
        <h3 className="text-2xl font-bold mb-4 text-center">Login / Sign In</h3>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Email address</label>
          <input
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mt-6">
          <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Submit
          </button>
        </div>
        <p className="mt-4 text-sm text-center text-gray-600">
          New user <a href="/register" className="text-indigo-600 hover:text-indigo-500">Register Here</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
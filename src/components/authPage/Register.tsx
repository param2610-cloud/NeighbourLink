import { createUserWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { motion } from "framer-motion";
// import { uploadFile } from "@/utils/aws/UploadFile"; //error 6ilo tai comment out kore diye6ii

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log(user);
      if (user) {
        let photoURL = "";
        //error 6ilo tai comment out kore diye6ii
        // if (photo) {
        //   const url =  await uploadFile(photo,`${user.uid}profile-image`);
        //   console.log(url);
         
        // }

        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          photo: photoURL,
        });
      }
      console.log("User Registered Successfully!!");
      toast.success("User Registered Successfully!!", {
        position: "top-center",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(err.message);
        toast.error("Ei Email ta already In USE ache..!! or Password thik dicchen na..!", {
          position: "bottom-center",
        });
      }
    }
  };

  return (
    <>
      <div className="h-screen w-full relative overflow-hidden">
        <img src="/src/assets/social_circle.avif" className="h-full w-full" alt="" style={{
          filter: 'brightness(0.5) contrast(1.2)'
        }} />
      </div>
      <div className="absolute top-0 left-0 flex items-center justify-center min-h-screen bg-transparent w-full">
        <button
          className="absolute flex justify-center items-center gap-3 top-4 left-4 px-4 py-2 text-gray-200 font-medium rounded-md shadow-sm focus:outline-none hover:cursor-pointer"
          onClick={() => (window.location.href = "/")}
        >
          <FaArrowAltCircleLeft size={25} /> Back to Home
        </button>
        <form onSubmit={handleRegister} className="w-full max-w-md p-6 bg-neutral-50/50 backdrop-blur-sm shadow-md rounded">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-2xl font-bold mb-4 text-center">Sign Up</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-900">First name</label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="First name"
                onChange={(e) => setFname(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-900">Last name</label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Last name"
                onChange={(e) => setLname(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-900">Email address</label>
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-900">Password</label>
              <input
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter password <minimum 6 characters>"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-900">Profile Photo</label>
              <div className="mt-1 flex justify-start w-fit items-center border rounded-md shadow-md bg-neutral-300">
                <label className=" text-neutral-600 font-medium py-2 px-4 rounded-md cursor-pointer">
                  {
                    photo?.name? photo.name:"Click here to upload photo"
                  }
                  <input type="file" className="hidden" onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)} />
                </label>
              </div>
            </div>

            <div className="mt-6">
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sign Up
              </button>
            </div>
            <p className="mt-4 text-lg text-center text-white">
              Already registered? <a href="/login" className="text-indigo-600 hover:text-indigo-500">Login</a>
            </p>
          </motion.div>

        </form>
      </div>
    </>
  );
}

export default Register;
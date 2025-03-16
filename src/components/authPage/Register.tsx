import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth, db } from "../../firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
        // if (photo) {
        //   const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
        //   await uploadBytes(photoRef, photo);
        //   photoURL = await getDownloadURL(photoRef);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        className="absolute top-4 left-4 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={() => (window.location.href = "/")}
    >
        Back to Home
    </button>
      <form onSubmit={handleRegister} className="w-full max-w-md p-6 bg-white shadow-md rounded">
        <h3 className="text-2xl font-bold mb-4 text-center">Sign Up</h3>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="First name"
            onChange={(e) => setFname(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Last name"
            onChange={(e) => setLname(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Email address</label>
          <input
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter password <minimum 6 characters>"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
          <input
            type="file"
            className="mt-1 block h-8 w-50 text-sm text-indigo-700 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
          />
        </div> */}

        <div className="mt-6">
          <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Sign Up
          </button>
        </div>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already registered <a href="/login" className="text-indigo-600 hover:text-indigo-500">Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;
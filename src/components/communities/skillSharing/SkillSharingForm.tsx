import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useStateContext } from "@/contexts/StateContext";
import { useNavigate } from "react-router-dom";
import { checkIfUserRegisteredInSkillSharing } from "@/utils/communities/CheckIfRegisterd";
import { FaArrowLeft } from "react-icons/fa";

interface SkillFormProps {
  isOpen: boolean;
}

const SkillSharingForm = ({ isOpen }: SkillFormProps) => {
  const [formData, setFormData] = useState({
    description: "",
    skills: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { user } = useStateContext();
  const navigate = useNavigate();

  if (user === null) return <div className="p-4 text-center">Loading...</div>;

  const isRegisterd = checkIfUserRegisteredInSkillSharing();

  useEffect(() => {
    isRegisterd.then((isRegisterd) => {
      if (isRegisterd) {
        navigate("/skillHome");
      }
    });
  }, [isRegisterd, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { email, photoURL } = user;

    try {
      // Validate required fields
      if (!formData.description || !formData.skills) {
        throw new Error("All fields are required");
      }

      if (formData.description.trim().length > 300) {
        throw new Error("Description should not exceed 300 characters");
      }

      if (formData.skills.trim().split(",").length > 100) {
        throw new Error("Skills should not exceed 100 values");
      }

      // fetch user data from Firestore
      const userDocRef = doc(db, "Users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData) {
          // Prepare data for Firestore (no createdAt field)
          const skillData = {
            ...formData,
            firstName: userData.firstName,
            lastName: userData.lastName,
            description: formData.description.trim(),
            email,
            photoURL,
            isActive: true,
            userId: user.uid,
            skills: formData.skills
              .trim()
              .split(",")
              .map((skill) => skill.trim()),
          };

          // Save to Firebase Firestore
          await addDoc(collection(db, "skill-sharing"), skillData);
          console.log("Form data saved to Firestore:", skillData);
          toast.success("Form submitted successfully", {
            position: "top-center",
          });

          setFormData({
            description: "",
            skills: "",
          });

          navigate("/skillHome");
        }
      } else {
        console.log("No such document!");
        setError("Failed to submit form");
        toast.error("Failed to submit form", {
          position: "top-center",
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to submit form");
        toast.error("Failed to submit form", {
          position: "top-center",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-2xl mx-auto my-8 px-4">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Back to Home
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Share Your Skills with the Community
          </h2>
          <p className="text-blue-100 text-center mt-2">
            Please Register Yourself to use this Feature
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-200">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 px-2 py-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="skills"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Skills (comma separated) *
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g., HTML, CSS, JavaScript"
                  className="mt-1 px-2 py-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Separate multiple skills with commas
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                className="w-full py-3 px-4 text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition hover:-translate-y-0.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SkillSharingForm;
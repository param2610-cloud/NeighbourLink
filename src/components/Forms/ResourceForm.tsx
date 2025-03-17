import React, { useState } from "react";
import { db } from "../../firebase"; // Import Firebase Firestore and Storage
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";

interface ResourceFormProps {
  userId: string;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ userId }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Medical");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  // Function to get user's location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const formattedLocation = formatLocation(latitude, longitude);
          setLocation(formattedLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to retrieve your location. Please enable location access.",{
            position: "bottom-center",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.",{
        position: "bottom-center",
      });
    }
  };

  // Function to format location as [12.34° N, 56.78° E]
  const formatLocation = (latitude: number, longitude: number) => {
    const latDirection = latitude >= 0 ? "N" : "S";
    const lonDirection = longitude >= 0 ? "E" : "W";
    const formattedLat = `${Math.abs(latitude).toFixed(2)}° ${latDirection}`;
    const formattedLon = `${Math.abs(longitude).toFixed(2)}° ${lonDirection}`;
    return `[${formattedLat}, ${formattedLon}]`;
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload photo to Firebase Storage (if provided)
      let photoUrl = "";
      // if (photo) {
      //   const storageRef = ref(storage, `resources/${photo.name}`);
      //   await uploadBytes(storageRef, photo);
      //   photoUrl = await getDownloadURL(storageRef);
      // }

      // Save resource post to Firestore
      const resourceData = {
        title,
        category,
        description,
        urgency,
        photoUrl,
        location, // Include location in the data
        userId,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "posts"), resourceData);
      console.log("Resource posted with ID: ", docRef.id);

      // Reset form
      setTitle("");
      setCategory("Medical");
      setDescription("");
      setUrgency(false);
      setPhoto(null);
      setLocation("");
      toast.success("Saved Successfully!!", {
              position: "top-center",
            });
    } catch (error) {
      console.error("Error posting resource: ", error);
      toast.error("Failed to post resource. Please try again.", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-400 to-purple-300">
      <button
        className="absolute top-4 left-4 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={() => (window.location.href = "/")}
    >
        Back to Home
    </button>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-6 border-4 border-indigo-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Post a Resource Request/Offer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Need a blood pressure monitor"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Medical">Medical</option>
              <option value="Tools">Tools</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (e.g., For my elderly mother)"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={urgency}
                onChange={(e) => setUrgency(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mark as Urgent</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={location}
                readOnly
                placeholder="Click to get location"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="mt-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Location
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Photo (Optional):</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  setPhoto(e.target.files[0]);
                }
              }}
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? "Posting..." : "Post Resource"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;
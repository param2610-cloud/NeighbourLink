import React, { useState } from "react";
import { db } from "../../firebase"; 
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { IoMdArrowRoundBack } from "react-icons/io";

interface ResourceSharingFormProps {
  userId: string;
}

const ResourceSharingForm: React.FC<ResourceSharingFormProps> = ({
  userId,
}) => {
  const [resourceName, setResourceName] = useState("");
  const [category, setCategory] = useState("Medical");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("New");
  const [, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

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
          toast.error(
            "Unable to retrieve your location. Please enable location access.",
            {
              position: "bottom-center",
            }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.", {
        position: "bottom-center",
      });
    }
  };

  
  const formatLocation = (latitude: number, longitude: number) => {
    const latDirection = latitude >= 0 ? "N" : "S";
    const lonDirection = longitude >= 0 ? "E" : "W";
    const formattedLat = `${Math.abs(latitude).toFixed(2)}° ${latDirection}`;
    const formattedLon = `${Math.abs(longitude).toFixed(2)}° ${lonDirection}`;
    return `[${formattedLat}, ${formattedLon}]`;
  };

  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      let photoUrl = "";

      
      const resourceData = {
        resourceName,
        category,
        description,
        condition,
        photoUrl,
        location, 
        userId,
        createdAt: new Date(),
      };

      const docRef = await addDoc(
        collection(db, "sharedResources"),
        resourceData
      );
      console.log("Resource shared with ID: ", docRef.id);

      
      setResourceName("");
      setCategory("Medical");
      setDescription("");
      setCondition("New");
      setPhoto(null);
      setLocation("");
      toast.success("Resource Shared Successfully!!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error sharing resource: ", error);
      toast.error("Failed to share resource. Please try again.", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:to-blue-900 bg-gradient-to-r from-indigo-500 to-blue-300">
      <button
        className="absolute top-4 left-4 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={() => (window.location.href = "/")}
      >
        <IoMdArrowRoundBack />
      </button>
      <div className="bg-white p-6 dark:bg-gray-700 rounded-lg shadow-md max-w-md mx-auto mt-6 border-4 dark:border-blue-600 border-indigo-500">
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-200 text-gray-800 text-center">
          Share a Resource
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700">
              Resource Name:
            </label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder="e.g., Blood Pressure Monitor"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700">
              Category:
            </label>
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
            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700">
              Description:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about the resource (e.g., Brand new, used only once)"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm dark:text-gray-200 font-medium text-gray-700">
              Condition:
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border dark:bg-gray-600 dark:text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="New">New</option>
              <option value="Used - Like New">Used - Like New</option>
              <option value="Used - Good">Used - Good</option>
              <option value="Used - Fair">Used - Fair</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700">
              Location:
            </label>
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
            <label className="block text-sm font-medium dark:text-gray-200 text-gray-700">
              Upload Photo (Optional):
            </label>
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
            {loading ? "Sharing..." : "Share Resource"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResourceSharingForm;

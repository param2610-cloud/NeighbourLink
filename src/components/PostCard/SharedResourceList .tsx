import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { MdDeleteForever } from "react-icons/md";
import PostCardDelete from "./modal/PostCardDelete";

interface SharedResource {
  id:string;
  category: string;
  createdAt: any;
  description: string;
  location: string;
  photoUrl: string;
  resourceName: string;
  condition: string;
  userId: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
}
interface SharedResourceListProps {
  resource: SharedResource;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
}

const SharedResourceList = ({ resource, setUpdated }: SharedResourceListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const shortOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const
  };

  const formatTimestamp = (timestamp: any) => {
    // Handle Firestore timestamp (which has seconds and nanoseconds properties)
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
        hour: '2-digit' as const,
        minute: '2-digit' as const
      };
      return date.toLocaleString('en-US', options);
    }
    // Handle regular Date objects or strings
    else if (timestamp) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-US', shortOptions);
      }
    }
    return "Invalid Date";
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", resource.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(`${userData.firstName} ${userData.lastName}`);
        } else {
          setUserName("Unknown User");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setUserName("Unknown User");
      }
    };

    fetchUserName();
  }, [resource.userId]);

  // Function to handle adding a new comment
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Math.random().toString(36).substr(2, 9), // Generate a unique ID
        text: newComment,
        userId: "currentUserId", // Replace with the actual logged-in user ID
        createdAt: new Date().toISOString(), // Use ISO string for consistent formatting
      };
      setComments([...comments, comment]);
      setNewComment("");
    }
  };

  // Function to handle sending a request
  const handleSendRequest = () => {
    toast.success("Request sent successfully!", {
      position: "top-center",
    });
  };

  return (
    <div className="w-full p-3 ">
      <div className="w-full h-full bg-white dark:bg-neutral-700 shadow-md rounded-lg p-3 md:p-6">
        {/* Resource Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center">
            <img
              src={resource.photoUrl || "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
              alt="Resource"
              className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover"
            />
            <div className="ml-2 md:ml-3">
              <h3 className="font-semibold text-gray-800 text-xs dark:text-gray-300 md:text-base">{userName}</h3>
              <p className="text-xs md:text-sm dark:text-gray-400 text-gray-500">
                {resource.createdAt && resource.createdAt.seconds ?
                  formatTimestamp(resource.createdAt) :
                  "Invalid Date"}
              </p>
            </div>
          </div>
          {
            auth.currentUser?.uid ===resource.userId && (
              <div className="flex justify-center items-center gap-2">
                <div className="text-red-600 dark:text-red-400 hover:cursor-pointer"
                onClick={() => setIsDeleteModalOpen(true)}
                >
                  <MdDeleteForever size={20} />
                </div>
              </div>
            )
          }
          <PostCardDelete
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            itemId={resource.id}
            itemType="post"
            onDelete={() => setUpdated((prev) => !prev)}
          />
        </div>
        {/* Resource Content */}
        <div className="mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold dark:text-white text-gray-900 mb-1 md:mb-2">{resource.resourceName}</h2>
          <p className="text-sm md:text-base dark:text-gray-200 text-gray-700">{resource.description}</p>
          <p className="text-sm md:text-base dark:text-gray-200 text-gray-700">
            <span className="font-semibold">Category:</span> {resource.category}
          </p>
          <p className="text-sm md:text-base dark:text-gray-200 text-gray-700">
            <span className="font-semibold">Condition:</span> {resource.condition}
          </p>
          <p className="text-sm md:text-base dark:text-gray-200 text-gray-700">
            <span className="font-semibold">Location:</span> {resource.location}
          </p>
        </div>
        {/* Resource Photo */}
        {resource.photoUrl && (
          <img
            src={resource.photoUrl}
            alt="Resource"
            className="w-full h-40 md:h-64 object-cover rounded-lg mb-3 md:mb-4"
          />
        )}
        {/* Send Request Button */}
        <button
          className="w-full px-3 py-1.5 md:px-4 md:py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-3 md:mb-4 text-sm md:text-base"
          onClick={handleSendRequest}
        >
          Ask For Resource
        </button>
        {/* Comments Section */}
        <div className="mt-3 md:mt-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-300 mb-2 text-sm md:text-base">Comments</h3>
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start">
                <img
                  src="https://via.placeholder.com/40"
                  alt="User"
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                />
                <div className="ml-2">
                  <p className="text-xs md:text-sm text-gray-800">{comment.text}</p>
                  <p className="text-xs text-gray-500">
                    {comment.createdAt && typeof comment.createdAt === 'string'
                      ? new Date(comment.createdAt).toLocaleString('en-US', shortOptions)
                      : (comment.createdAt && typeof comment.createdAt === 'object' && 'seconds' in comment.createdAt
                        ? formatTimestamp(comment.createdAt)
                        : "Invalid Date")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Add Comment Input */}
          <div className="mt-3 md:mt-4 flex items-center">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-2 py-1 md:px-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs md:text-sm"
            />
            <button
              onClick={handleAddComment}
              className="ml-2 px-2 py-1 md:px-3 md:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-xs md:text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedResourceList;
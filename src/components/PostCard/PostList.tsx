import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

interface Post {
  category: string;
  createdAt: any;
  description: string;
  location: string;
  photoUrl: string;
  title: string;
  urgency: boolean;
  userId: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | string;
}

const PostList = ({ post }: { post: Post }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");

  const shortOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };

  const formatTimestamp = (timestamp: any) => {
    // Handle Firestore timestamp (which has seconds and nanoseconds properties)
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        const userDoc = await getDoc(doc(db, "Users", post.userId));
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

    console.log("post data=", post);
    fetchUserName();
  }, [post.userId]);

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
      <div className="w-full h-full bg-white shadow-md rounded-lg p-3 md:p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center">
            <img
              src={post.photoUrl || "/src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
              alt="Post"
              className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover"
            />
            <div className="ml-2 md:ml-3">
              <h3 className="font-semibold text-gray-800 text-xs md:text-base">{userName}</h3>
              <p className="text-xs md:text-sm text-gray-500">
                {post.createdAt && post.createdAt.seconds ? 
                  formatTimestamp(post.createdAt) : 
                  "Invalid Date"}
              </p>
            </div>
          </div>
          
        </div>
        {/* Post Content */}
        <div className="mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">{post.title}</h2>
          <p className="text-sm md:text-base text-gray-700">{post.description}</p>
          {post.urgency && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs md:text-sm rounded-full">
              Urgent
            </span>
          )}
        </div>
        {/* Post Photo */}
        {post.photoUrl && (
          <img
            src={post.photoUrl}
            alt="Post"
            className="w-full h-40 md:h-64 object-cover rounded-lg mb-3 md:mb-4"
          />
        )}
        {/* Send Request Button */}
        <button
          className={`w-full px-3 py-1.5 md:px-4 md:py-2 text-white font-medium rounded-md shadow-sm focus:outline-none mb-3 md:mb-4 text-sm md:text-base
            ${post.urgency ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"}
            `}
          onClick={handleSendRequest}
        >
          Send Response
        </button>
        {/* Comments Section */}
        <div className="mt-3 md:mt-4">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">Comments</h3>
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

export default PostList;
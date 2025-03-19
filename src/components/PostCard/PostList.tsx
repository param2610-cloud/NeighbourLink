import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import PostDetails from "./modal/PostDetails";
import { MdDeleteForever } from "react-icons/md";
import PostCardDelete from "./modal/PostCardDelete";



interface ResponderData {
  userId: string;
  accepted: boolean;
}

export interface Post {
  id: string
  category: string;
  createdAt: any;
  description: string;
  location: string;
  photoUrl: string;
  title: string;
  urgency: boolean;
  userId: string;
  responders: ResponderData[];
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
interface PostListProps {
  post: Post;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
}

const PostList = ({ post, setUpdated }: PostListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const shortOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const formatTimestamp = (timestamp: any) => {
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
    } else if (timestamp) {
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        text: newComment,
        userId: "currentUser Id",
        createdAt: new Date().toISOString(), 
      };
      setComments([...comments, comment]);
      setNewComment("");
    }
  };

  // const handleSendRequest = () => {
  //   toast.success("Request sent successfully!", {
  //     position: "top-center",
  //   });
  // };

  return (
    <div className="w-full p-3">
      <div className="w-full h-full bg-white dark:bg-neutral-700 shadow-md rounded-lg p-4 md:p-6">
        
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center">
            <img
              src={post.photoUrl || "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
              alt="Post"
              className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover"
            />
            <div className="ml-2 md:ml-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-300 text-xs md:text-base">{userName}</h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {post.createdAt && post.createdAt.seconds ?
                  formatTimestamp(post.createdAt) :
                  "Invalid Date"}
              </p>
            </div>
          </div>
          {
            auth.currentUser?.uid === post.userId && (
              <div className="flex justify-center items-center gap-2">
                {/* <div className="text-blue-600 dark:text-blue-400 hover:cursor-pointer">
                  <FaRegEdit />
                </div> */}
                <div className="text-red-600 dark:text-red-400 hover:cursor-pointer" onClick={() => setIsDeleteModalOpen(true)}>
                  <MdDeleteForever size={20} />
                </div>
              </div>
            )
          }
          <PostCardDelete
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            itemId={post.id}
            itemType="post"
            onDelete={() => setUpdated((prev) => !prev)}
          />
          
        </div>
        
        <div className="mb-3 md:mb-4 ">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-200 mb-1 md:mb-2">{post.title}</h2>
          <p className="text-sm md:text-base text-gray-700 dark:text-neutral-300 font-light mb-2">{post.description}</p>
          {post.urgency && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs md:text-sm rounded-full">
              Urgent
            </span>
          )}
        </div>
        
        {post.photoUrl && (
          <img
            src={post.photoUrl}
            alt="Post"
            className="w-full h-40 md:h-64 object-cover rounded-lg mb-3 md:mb-4"
          />
        )}
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm focus:outline-none mb-3 md:mb-4 text-sm md:text-base"
        >
          View Details
        </button>
        
        <div className="mt-3 md:mt-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-300 mb-2 text-sm md:text-base">Comments</h3>
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start">
                <img
                  src="https://via.placeholder.com/40"
                  alt="User "
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

      
      <PostDetails post={post} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
   
  );
};

export default PostList;
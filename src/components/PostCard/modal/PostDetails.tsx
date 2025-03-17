import React, { useEffect } from 'react';
import { Post } from '../PostList';
import { auth, db } from "../../../firebase";
import { collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface PostDetailsProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

const PostDetails: React.FC<PostDetailsProps> = ({ post, isOpen, onClose }) => {
  if (!isOpen) return null;


const handleResponse = async (): Promise<void> => {
    const postId: string = post.id;
    const userId: string | undefined = auth.currentUser?.uid;
    
    if (!userId) {
        console.error("User not authenticated");
        return;
    }
    
    try {
        const postRef = doc(db, 'posts', postId);
        
        await updateDoc(postRef, {
            responders: arrayUnion(userId)
        });
        
        console.log("Successfully added user to responders");
    } catch (err) {
        console.error("Error updating responders:", err);
        throw err;
    }
}

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-neutral-900/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 w-11/12 md:w-3/4 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Post Details */}
          <div className="flex-1 md:pr-6 md:border-r md:border-gray-200 md:dark:border-neutral-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">{post.title}</h2>
            <p className="text-gray-700 dark:text-neutral-300 mb-4">{post.description}</p>
            
            {post.photoUrl && (
              <img
                src={post.photoUrl}
                alt="Post"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created by: {post.userId}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt.seconds * 1000).toLocaleString()}
              </p>
            </div>

            <button
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4"
              onClick={()=>handleResponse()}
            >
              Respond
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Right Column - Responses */}
          <div className="flex-1 md:pl-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">
              Responses
            </h3>
            {post.responders && post.responders.length > 0 ? (
              <div className="space-y-3">
                {post.responders.map((user) => (
                  <div
                    key={user}
                    className="p-3 bg-gray-100 dark:bg-neutral-700 rounded-lg"
                  >
                    <p className="text-gray-900 dark:text-gray-200">{user}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Nobody responded yet</p>
            )} 
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
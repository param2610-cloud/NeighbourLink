import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { BsChevronRight } from 'react-icons/bs';

interface ItemReferenceCardProps {
  postId: string;
  title?: string;
  imageUrl?: string;
}

interface PostData {
  id: string;
  title: string;
  description: string;
  category: string;
  photoUrls?: string[];
  postType: 'need' | 'offer';
}

const ItemReferenceCard: React.FC<ItemReferenceCardProps> = ({ postId, title, imageUrl }) => {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          setPost({
            id: postSnap.id,
            ...postSnap.data()
          } as PostData);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  
  const displayTitle = post?.title || title || 'Post Details';
  const displayImage = post?.photoUrls?.[0] || imageUrl;
  const postType = post?.postType || 'offer';

  return (
    <Link 
      to={`/post/${postId}`}
      className="block bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 p-3 relative"
    >
      <div className="flex items-center">
        {displayImage && (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-3">
            {/* Remove className prop since ImageDisplay doesn't accept it */}
            <ImageDisplay objectKey={displayImage} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className={`px-2 py-0.5 text-xs rounded mr-2 ${
              postType === 'offer' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200'
            }`}>
              {postType === 'offer' ? 'Offering' : 'Needed'}
            </span>
            <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
              {loading ? 'Loading...' : error ? 'Post Unavailable' : displayTitle}
            </h3>
          </div>
          
          {post?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
              {post.description}
            </p>
          )}
        </div>
        
        <BsChevronRight className="text-gray-400 ml-2" />
      </div>
    </Link>
  );
};

export default ItemReferenceCard;

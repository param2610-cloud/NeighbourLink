import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BsChevronRight } from 'react-icons/bs';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';

interface ItemReferenceCardProps {
  postId: string;
  title?: string;
  imageUrl?: string;
}

interface PostData {
  id: string;
  title: string;
  description: string;
  category?: string;
  photoUrls?: string[];
  images?: string[]; // For promotions
  postType?: 'need' | 'offer';
  type?: string; // For promotions
  eventType?: string; // For events
  _collection?: string; // Track which collection this came from
}

const ItemReferenceCard: React.FC<ItemReferenceCardProps> = ({ postId, title, imageUrl }) => {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        
        // Define all possible collections to search
        const collections = ['resources', 'posts', 'promotions', 'events'];
        
        // Try each collection in parallel for better performance
        const promises = collections.map(async (collectionName) => {
          try {
            const postRef = doc(db, collectionName, postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
              return {
                id: postSnap.id,
                ...postSnap.data(),
                _collection: collectionName // Track which collection this came from
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching from ${collectionName}:`, error);
            return null;
          }
        });
        
        // Wait for all promises and find the first successful result
        const results = await Promise.all(promises);
        const foundPost = results.find(result => result !== null);
        
        if (foundPost) {
          setPost(foundPost as unknown as PostData);
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

  
  const displayTitle = post?.title || title || 'Item Details';
  const displayImage = post?.photoUrls?.[0] || post?.images?.[0] || imageUrl;
  
  // Determine the type of item and set the appropriate route and label
  let itemType: string;
  let linkPath: string;
  
  // Use collection information if available for more accurate detection
  if (post?._collection === 'promotions' || post?.type !== undefined) {
    itemType = 'business';
    linkPath = `/promotion/${postId}`;
  } else if (post?._collection === 'events' || post?.eventType !== undefined) {
    itemType = 'event';
    linkPath = `/event/${postId}`;
  } else {
    itemType = post?.postType || 'offer';
    linkPath = `/resource/${postId}`;
  }

  return (
    <Link 
      to={linkPath}
      className="block bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 p-3 relative"
    >
      <div className="flex items-center">
        {displayImage && (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-3">
            
            <ImageDisplay publicId={displayImage} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className={`px-2 py-0.5 text-xs rounded mr-2 ${
              itemType === 'business'
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200'
                : itemType === 'event'
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200'
                : itemType === 'offer' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200'
            }`}>
              {itemType === 'business' ? 'Business' : itemType === 'event' ? 'Event' : itemType === 'offer' ? 'Offering' : 'Needed'}
            </span>
            <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
              {loading ? 'Loading...' : error ? 'Item Unavailable' : displayTitle}
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

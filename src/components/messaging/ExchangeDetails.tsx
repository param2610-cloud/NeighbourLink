import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiMapPin, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { sendMessage } from '../../services/messagingService';
import GoogleMapsViewer from '../../utils/google_map/GoogleMapsViewer';

interface ExchangeDetailsProps {
  exchangeId: string;
  conversationId: string;
  currentUserId: string;
}

interface Exchange {
  id: string;
  conversationId: string;
  postId: string;
  createdBy: string;
  exchangeType: 'pickup' | 'delivery';
  location: {
    name: string;
    address: string;
    isSafe: boolean;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dateTime: any; 
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: any; 
}

const ExchangeDetails: React.FC<ExchangeDetailsProps> = ({
  exchangeId,
  conversationId,
  currentUserId
}) => {
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'exchanges', exchangeId),
      (doc) => {
        if (doc.exists()) {
          setExchange({ id: doc.id, ...doc.data() } as Exchange);
        } else {
          setError('Exchange not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error getting exchange:', err);
        setError('Failed to load exchange details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [exchangeId]);

  const handleAccept = async () => {
    if (!exchange) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, 'exchanges', exchangeId), {
        status: 'accepted'
      });

      
      await sendMessage(
        conversationId,
        currentUserId,
        `I've accepted the ${exchange.exchangeType} arrangement.`
      );
    } catch (error) {
      console.error('Error updating exchange:', error);
      alert('Failed to accept exchange. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!exchange) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, 'exchanges', exchangeId), {
        status: 'rejected'
      });

      
      await sendMessage(
        conversationId,
        currentUserId,
        `I can't make the proposed ${exchange.exchangeType} arrangement. Let's find another time.`
      );
    } catch (error) {
      console.error('Error updating exchange:', error);
      alert('Failed to reject exchange. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!exchange) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, 'exchanges', exchangeId), {
        status: 'completed'
      });

      
      await sendMessage(
        conversationId,
        currentUserId,
        `I've completed the ${exchange.exchangeType}. Thank you!`
      );
    } catch (error) {
      console.error('Error updating exchange:', error);
      alert('Failed to mark as completed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse">Loading exchange details...</div>;
  }

  if (error || !exchange) {
    return <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">{error || 'Exchange not available'}</div>;
  }

  
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown time';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isCreator = exchange.createdBy === currentUserId;
  const isPending = exchange.status === 'pending';
  const isAccepted = exchange.status === 'accepted';
  const isRejected = exchange.status === 'rejected';
  const isCompleted = exchange.status === 'completed';

  return (
    <div className={`p-4 rounded-md mb-4 ${
      isRejected 
        ? 'bg-red-50 dark:bg-red-900/30' 
        : isCompleted 
          ? 'bg-green-50 dark:bg-green-900/30'
          : 'bg-blue-50 dark:bg-blue-900/30'
    }`}>
      <div className="mb-2">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
          isRejected 
            ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200' 
            : isCompleted 
              ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
              : isAccepted 
                ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200'
        }`}>
          {exchange.exchangeType.charAt(0).toUpperCase() + exchange.exchangeType.slice(1)} {exchange.status}
        </span>
      </div>
      


      {/* Display map if coordinates are available */}
      {exchange.location.coordinates && (
        <div className="mb-4">
          <GoogleMapsViewer
            center={exchange.location.coordinates}
            zoom={16}
            markers={[{
              position: exchange.location.coordinates,
              color: '#4CAF50',
              title: exchange.location.name
            }]}
            height="180px"
          />
        </div>
      )}
      
      <div className="flex items-start mb-2">
        <FiMapPin className="mt-1 mr-2 text-gray-500 dark:text-gray-400" />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{exchange.location.name}</div>
          {exchange.location.address && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{exchange.location.address}</div>
          )}
          {exchange.location.isSafe && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">Safe Exchange Location</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center mb-4">
        <FiClock className="mr-2 text-gray-500 dark:text-gray-400" />
        <div className="text-gray-900 dark:text-white">{formatDateTime(exchange.dateTime)}</div>
      </div>
      
      {isPending && !isCreator && (
        <div className="flex space-x-2">
          <button 
            onClick={handleAccept}
            disabled={updating}
            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center disabled:opacity-50"
          >
            <FiCheck className="mr-1" /> Accept
          </button>
          <button
            onClick={handleReject}
            disabled={updating}
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center disabled:opacity-50"
          >
            <FiX className="mr-1" /> Decline
          </button>
        </div>
      )}
      
      {isAccepted && !isCompleted && (
        <button
          onClick={handleComplete}
          disabled={updating}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center disabled:opacity-50"
        >
          <FiCheck className="mr-1" /> Mark as Completed
        </button>
      )}
    </div>
  );
};

export default ExchangeDetails;

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiMapPin } from 'react-icons/fi';
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
    <div className={`flex mb-4 ${isCreator ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md w-full rounded-xl shadow-md overflow-hidden ${
        isRejected ? 'bg-red-900/10' : isCompleted ? 'bg-green-900/8' : 'bg-indigo-900/8'
      }`}>
        <div className="flex items-start justify-between p-3 gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-white/6 flex items-center justify-center">
              <FiMapPin className="text-yellow-300 w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{exchange.location.name}</div>
              <div className="text-xs text-indigo-200/60">{exchange.location.address}</div>
              {exchange.location.isSafe && <div className="text-xs text-yellow-300 mt-1">Safe Exchange Location</div>}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-yellow-300 font-semibold">{exchange.exchangeType.charAt(0).toUpperCase() + exchange.exchangeType.slice(1)}</div>
            <div className="text-sm text-indigo-100">{formatDateTime(exchange.dateTime)}</div>
            <div className="mt-1 text-xs text-indigo-200/60">Status: <span className="font-medium text-white">{exchange.status}</span></div>
          </div>
        </div>

        {exchange.location.coordinates && (
          <div className="px-3 pb-3">
            <GoogleMapsViewer
              center={exchange.location.coordinates}
              zoom={15}
              markers={[{
                position: exchange.location.coordinates,
                color: '#FFD54F',
                title: exchange.location.name
              }]}
              height="120px"
            />
          </div>
        )}

        <div className="p-3 border-t border-white/6 bg-black/10 flex items-center gap-3">
          {isPending && !isCreator ? (
            <>
              <button onClick={handleAccept} disabled={updating} className="flex-1 py-2 rounded-md bg-yellow-400 text-black text-sm font-semibold disabled:opacity-50">Accept</button>
              <button onClick={handleReject} disabled={updating} className="py-2 px-3 rounded-md bg-transparent border border-white/6 text-sm text-indigo-100 disabled:opacity-50">Decline</button>
            </>
          ) : isAccepted && !isCompleted ? (
            <button onClick={handleComplete} disabled={updating} className="w-full py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50">Mark as Completed</button>
          ) : (
            <div className="text-xs text-indigo-200">{isCompleted ? 'Completed' : exchange.status}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangeDetails;

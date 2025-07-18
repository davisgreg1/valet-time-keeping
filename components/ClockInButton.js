import { useState } from 'react';
import { Clock, MapPin, CheckCircle } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentLocationWithAddress, formatLocation } from '@/utils/location';
import toast from 'react-hot-toast';

export default function ClockInButton({ user, onClockAction }) {
  const [isClocking, setIsClocking] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);

  const handleClockAction = async () => {
    setIsClocking(true);
    
    try {
      // Get current location with address
      const location = await getCurrentLocationWithAddress();
      
      // Check last clock action
      const q = query(
        collection(db, 'clockIns'),
        where('valetId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      const lastRecord = querySnapshot.docs[0]?.data();
      
      // Determine action type
      const actionType = !lastRecord || lastRecord.action === 'clock_out' ? 'clock_in' : 'clock_out';
      
      // Create clock record
      const clockData = {
        valetId: user.uid,
        valetEmail: user.email,
        action: actionType,
        timestamp: new Date().toISOString(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          formatted: formatLocation(location.latitude, location.longitude),
          address: location.address,
          shortAddress: location.shortAddress,
          geocoded: location.geocoded
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };
      
      // Save to Firestore
      await addDoc(collection(db, 'clockIns'), clockData);
      
      setLastAction(actionType);
      setLastLocation(location.shortAddress);
      toast.success(`Successfully clocked ${actionType === 'clock_in' ? 'in' : 'out'} at ${location.shortAddress}!`);
      
      // Trigger refresh of parent components
      if (onClockAction) {
        onClockAction();
      }
      
    } catch (error) {
      console.error('Clock action error:', error);
      toast.error('Failed to clock in/out. Please try again.');
    } finally {
      setIsClocking(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleClockAction}
        disabled={isClocking}
        className="w-32 h-32 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isClocking ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent mb-2"></div>
            <span className="text-sm">Processing...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Clock className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Clock In/Out</span>
          </div>
        )}
      </button>
      
      {lastAction && lastLocation && (
        <div className="mt-4 flex flex-col items-center gap-2 text-green-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">
              Successfully clocked {lastAction === 'clock_in' ? 'in' : 'out'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{lastLocation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
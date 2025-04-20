import { useState, useEffect } from 'react';

type LoadingProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Added larger size options
  duration?: number; // Animation cycle duration in ms
};

export default function NeighbourLinkLoader({ 
  size = 'lg', // Changed default to 'lg'
  duration = 2000
}: LoadingProps) {
  const [progress, setProgress] = useState(0);
  
  // Size classes mapping - added larger sizes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    '2xl': 'w-64 h-64'
  };
  
  // Animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, duration / 100);
    
    return () => clearInterval(interval);
  }, [duration]);
  
  // Calculate animated values based on progress
  const pinPosition = {
    x: 100,
    y: progress < 50 ? 70 - progress/5 : 60 + (progress-50)/5
  };
  
  // Calculate line path progress
  const leftLinePath = `M80,120 Q ${90 + progress/10},${110 - progress/2} ${pinPosition.x},${pinPosition.y}`;
  const rightLinePath = `M120,120 Q ${110 - progress/10},${110 - progress/2} ${pinPosition.x},${pinPosition.y}`;
  
  // Calculate pulse animations
  const pulseOpacity = Math.abs(Math.sin(progress * Math.PI / 50));
  
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-black/50">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Background gradient */}
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.3" />
              <stop offset={`${progress}%`} stopColor="#4FD1C5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4FD1C5" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Left House */}
          <g className="drop-shadow-md">
            <polygon 
              points="50,100 20,120 20,170 80,170 80,120" 
              className="fill-blue-400" 
            />
            <rect x="35" y="130" width="10" height="10" fill="white" />
            <rect x="55" y="130" width="10" height="10" fill="white" />
            <rect x="40" y="150" width="20" height="20" fill="white" />
          </g>
          
          {/* Right House */}
          <g className="drop-shadow-md">
            <polygon 
              points="150,100 120,120 120,170 180,170 180,120" 
              className="fill-indigo-500" 
            />
            <rect x="135" y="130" width="10" height="10" fill="white" />
            <rect x="155" y="130" width="10" height="10" fill="white" />
            <rect x="140" y="150" width="20" height="20" fill="white" />
          </g>
          
          {/* Connecting Lines - Animated with gradient */}
          <path 
            d={leftLinePath} 
            fill="none" 
            stroke="url(#connectionGradient)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          
          <path 
            d={rightLinePath} 
            fill="none" 
            stroke="url(#connectionGradient)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          
          {/* Connection pulse effects */}
          <circle 
            cx="80" 
            cy="120" 
            r={5 + pulseOpacity * 3}
            className="fill-teal-400"
            style={{ opacity: 0.6 * pulseOpacity }}
          />
          
          <circle 
            cx="120" 
            cy="120" 
            r={5 + pulseOpacity * 3}
            className="fill-teal-400"
            style={{ opacity: 0.6 * pulseOpacity }}
          />
          
          {/* Moving Location Pin */}
          <g 
            transform={`translate(${pinPosition.x - 100}, ${pinPosition.y - 70})`}
            className="drop-shadow-lg"
          >
            <circle cx="100" cy="70" r="15" className="fill-pink-500" />
            <circle cx="100" cy="70" r="6" fill="white" />
            <polygon 
              points="100,85 92,95 108,95" 
              className="fill-pink-500" 
            />
          </g>
          
          {/* Data packets traveling along the connection */}
          {progress > 30 && progress < 90 && (
            <>
              <circle 
                cx={80 + (pinPosition.x - 80) * (progress % 30) / 30}
                cy={120 - (120 - pinPosition.y) * (progress % 30) / 30}
                r="3"
                className="fill-blue-300"
              />
              
              <circle 
                cx={120 - (120 - pinPosition.x) * (progress % 20) / 20}
                cy={120 - (120 - pinPosition.y) * (progress % 20) / 20}
                r="3"
                className="fill-indigo-300"
              />
            </>
          )}
        </svg>
      </div>
      
      {/* Loading Text with Dynamic Progress */}
      <div className="mt-4 font-medium text-center">
        <div className="text-gray-200">Connecting neighbours</div>
      </div>
    </div>
  );
}
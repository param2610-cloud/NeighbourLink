import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const [blinking, setBlinking] = useState(false);
  const [earWiggle, setEarWiggle] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [tiltDirection, setTiltDirection] = useState(1);
  const [eyeMovement, setEyeMovement] = useState(0);
  const navigate= useNavigate();

  // Handle blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Handle ear wiggle animation
  useEffect(() => {
    const earTimer = setInterval(() => {
      setEarWiggle(prev => (prev + 1) % 3);
    }, 500);
    
    return () => clearInterval(earTimer);
  }, []);

  // Handle head tilt animation
  useEffect(() => {
    const tiltTimer = setInterval(() => {
      setHeadTilt(prev => {
        if (prev > 8) setTiltDirection(-1);
        if (prev < -8) setTiltDirection(1);
        return prev + tiltDirection * 0.2;
      });
    }, 100);
    
    return () => clearInterval(tiltTimer);
  }, [tiltDirection]);

  // Handle eye movement animation
  useEffect(() => {
    const eyeTimer = setInterval(() => {
      setEyeMovement(prev => (prev + 1) % 6);
    }, 800);
    
    return () => clearInterval(eyeTimer);
  }, []);

  // Calculate eye pupil position based on movement state
  const eyePositions = [
    { x: 0, y: 0 },    // center
    { x: -2, y: -2 },  // look up left
    { x: 0, y: -2 },   // look up 
    { x: 2, y: -2 },   // look up right
    { x: 2, y: 0 },    // look right
    { x: 0, y: 0 },    // back to center
  ];
  
  const currentEyePos = eyePositions[eyeMovement];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-100 p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-8xl font-bold text-blue-700 mb-4">404</h1>
        
        {/* Large Dog Face Container */}
        <div 
          className="relative mx-auto w-72 h-80 mb-8"
          style={{ transform: `rotate(${headTilt}deg)` }}
        >
          {/* Dog face/head */}
          <div className="w-full h-full bg-amber-200 rounded-full relative shadow-lg">
            {/* Ears */}
            <div 
              className="absolute -left-12 top-8 w-24 h-32 bg-amber-300 rounded-tl-full rounded-bl-full origin-right"
              style={{ transform: `rotate(${-5 + earWiggle * 4}deg)` }}
            ></div>
            <div 
              className="absolute -right-12 top-8 w-24 h-32 bg-amber-300 rounded-tr-full rounded-br-full origin-left"
              style={{ transform: `rotate(${5 - earWiggle * 4}deg)` }}
            ></div>
            
            {/* Muzzle */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-32 bg-amber-100 rounded-4xl"></div>
            
            {/* Nose */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-16 h-10 bg-gray-800 rounded-full"></div>
            
            {/* Mouth - confused but not angry (slightly open) */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-10 h-6 bg-gray-700 rounded-full opacity-25"></div>
            
            {/* Eyes - wider and more surprised looking */}
            <div className="flex justify-between w-48 absolute top-32 left-1/2 transform -translate-x-1/2">
              {/* Left eye */}
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center">
                {/* Eyebrow - raised in confusion, not angled down in anger */}
                <div className="absolute -top-8 w-16 h-3 bg-amber-400 rounded-full transform -rotate-10"></div>
                
                {/* Pupil that moves around */}
                <div 
                  className={`w-10 h-${blinking ? '1' : '10'} bg-gray-800 rounded-full relative`}
                  style={{ transform: `translate(${currentEyePos.x}px, ${currentEyePos.y}px)` }}
                >
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full opacity-60"></div>
                </div>
              </div>
              
              {/* Right eye */}
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center">
                {/* Eyebrow - raised in confusion, not angled down in anger */}
                <div className="absolute -top-8 w-16 h-3 bg-amber-400 rounded-full transform rotate-10"></div>
                
                {/* Pupil that moves around */}
                <div 
                  className={`w-10 h-${blinking ? '1' : '10'} bg-gray-800 rounded-full relative`}
                  style={{ transform: `translate(${currentEyePos.x}px, ${currentEyePos.y}px)` }}
                >
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full opacity-60"></div>
                </div>
              </div>
            </div>
            
            {/* Forehead wrinkles for confusion */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-32 h-8 flex flex-col gap-2">
              <div className="w-full h-2 border-t-2 border-amber-300 rounded"></div>
              <div className="w-full h-2 border-t-2 border-amber-300 rounded"></div>
            </div>
            
            {/* Question marks around the head */}
            <div className="absolute -top-12 left-6 text-green-500 text-4xl font-bold animate-bounce">?</div>
            <div className="absolute -top-8 right-6 text-green-500 text-3xl font-bold animate-bounce" style={{ animationDelay: '0.4s' }}>?</div>
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-green-500 text-5xl font-bold animate-bounce" style={{ animationDelay: '0.8s' }}>?</div>
          </div>
        </div>
        
        <div className="text-xl font-medium text-gray-700 mb-6">
          Oops! Page Not Found
        </div>
        
        <p className="text-md text-gray-600 mb-8 max-w-md mx-auto">
          Our confused pup can't seem to find the page you're looking for. It might be in another doghouse!
        </p>
        
        <button 
          className="px-8 py-4 bg-blue-700 text-white text-md font-medium rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300"
          onClick={() => navigate('/')}
        >
          Take Me Home
        </button>
      </div>
    </div>
  );
}
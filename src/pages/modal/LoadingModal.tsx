import { useEffect } from "react";
import { Loader } from "lucide-react";

const LoadingModal = ({ isOpen }: { isOpen: boolean }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-modal-title"
    >
      {/* Blurry transparent overlay */}
      <div className="fixed inset-0 bg-white/10 backdrop-blur-sm transition-opacity" />
      
      {/* Modal content */}
      <div
        className="relative transform rounded-xl bg-white/60 p-6 shadow-xl transition-all duration-300 dark:bg-gray-800/60 dark:shadow-gray-900/50 w-full max-w-xs border border-gray-200 dark:border-gray-700 backdrop-blur-md"
      >
        <div className="flex flex-col items-center">
          {/* Animated spinner */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-green-100/70 blur-md dark:bg-green-900/30" />
            <Loader
              className="relative z-10 my-2 animate-spin text-green-600 dark:text-green-400"
              size={36}
              aria-hidden="true"
            />
          </div>

          {/* Title and description */}
          <h3
            id="loading-modal-title"
            className="text-lg font-medium text-gray-800 dark:text-white"
          >
            Loading Volunteer Hub
          </h3>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-300">
            Please wait while we set things up...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
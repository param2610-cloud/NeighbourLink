import React from 'react';
import { Link } from 'react-router-dom';

const PujoGuideNavigation: React.FC = () => {
  return (
    <div className="p-4">
      <Link 
        to="/pujo-planner" 
        className="inline-block bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Open PujoGuide - Pandal Planner
      </Link>
    </div>
  );
};

export default PujoGuideNavigation;

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useNavigate } from 'react-router-dom';

const SkillList = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'skill-sharing'));
        const skillsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSkills(skillsData);
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading skills...</div>;

  if (skills.length === 0) return <div className="p-4 text-center">No skills found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {skills.map((skill) => (
        <div key={skill.id} className="bg-white rounded-lg shadow-md p-4 dark:bg-neutral-700">
          {/* Header with name and email */}
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {skill.firstName} {skill.lastName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {skill.email}
            </p>
          </div>

          {/* Description */}
          <div className="mb-3">
            <p className="text-gray-700 dark:text-gray-300">
              {skill.description}
            </p>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
              Skills:
            </h3>
            <div className="flex flex-wrap gap-2">
              {skill.skills.split(',').map((skillItem: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
                >
                  {skillItem.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => navigate(`/skills/${skill.id}`)}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
};

export default SkillList;
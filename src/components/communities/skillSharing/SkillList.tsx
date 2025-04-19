import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import { checkIfUserRegisteredInSkillSharing } from "@/utils/communities/CheckIfRegisterd";
import { useStateContext } from "@/contexts/StateContext";
import { FaArrowRight, FaUserCircle, FaLightbulb } from "react-icons/fa";
import { MdOutlineWavingHand } from "react-icons/md";
import { Switch } from "@/components/ui/switch";
import { calculateDistance } from "@/utils/utils";

const SkillList = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isRegisterd = checkIfUserRegisteredInSkillSharing();

  useEffect(() => {
    isRegisterd.then((isRegisterd) => {
      if (!isRegisterd) {
        navigate("/skills-sharing-register");
      }
    });
  }, [isRegisterd, navigate]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "skill-sharing"));
        const skillsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const q = query(
          collection(db, "Users"),
          where("email", "==", user?.email)
        );
        const currentUser = (await getDocs(q)).docs.map((doc) => doc.data())[0];
        const userLocation = {
          lat: currentUser?.location?.latitude,
          lng: currentUser?.location?.longitude,
        };

        const preferredRadius = currentUser?.location?.preferredRadius || 6;

        const skillsData2 = skillsData.map(async (e) => {
          const q = query(
            collection(db, "Users"),
            where("email", "==", (e as { id: string; email: string }).email)
          );
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map((doc) => doc.data())[0];
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            data?.location?.latitude,
            data?.location?.longitude
          );

          return {
            ...e,
            isGlobal: distance > preferredRadius,
          };
        });
        setSkills(await Promise.all(skillsData2));
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const { user } = useStateContext();

  const [filter, setFilter] = useState({
    skill: "",
    isGlobal: true,
  });
  const filteredSkills = skills.filter((e) => {
    const one = () => e.email !== user?.email;
    const two = () => e.isGlobal === filter.isGlobal;
    const three = () => {
      if (filter.skill) {
        return e.skills
          .toString()
          .toLowerCase()
          .includes(filter.skill.toLowerCase());
      }
      return true;
    };

    return one() && two() && three();
    // return one();
  });

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter((prev) => ({ ...prev, skill: e.target.value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFilter((prev) => ({ ...prev, isGlobal: checked }));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center p-10">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-transparent border-t-blue-600 border-b-blue-600 dark:border-t-blue-400 dark:border-b-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading skills...
          </p>
        </div>
      </div>
    );

  if (skills.length === 0)
    return (
      <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <FaLightbulb className="w-12 h-12 text-blue-500 dark:text-blue-300" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          No skills found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Be the first to share your skills with the community! Your expertise
          could make a difference in someone's life.
        </p>
        <button
          onClick={() => navigate("/skills-sharing-register")}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition-all transform hover:-translate-y-0.5"
        >
          Share Your Skills
        </button>
      </div>
    );

  return (
    <>
      <form className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex flex-col flex-1">
          <label
            htmlFor="skill-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Skills Required
          </label>
          <input
            id="skill-filter"
            placeholder="Type a skill to filter..."
            value={filter.skill}
            onChange={handleSkillChange}
            className="mt-1 px-2 py-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            // required
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="global-switch"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Local
          </label>
          <Switch
            id="global-switch"
            checked={filter.isGlobal}
            onCheckedChange={handleSwitchChange}
          />
          <label
            htmlFor="global-switch"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Global
          </label>
        </div>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
              {/* Header with gradient and avatar */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 p-5 text-white relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>

                <div className="flex items-center space-x-3 relative">
                  <div className="bg-white dark:bg-gray-200 p-1 rounded-full shadow-md">
                    <FaUserCircle className="text-3xl text-blue-600 dark:text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {skill.firstName} {skill.lastName}
                    </h2>
                    <p className="text-blue-100 dark:text-blue-200 text-sm flex items-center">
                      <MdOutlineWavingHand className="mr-1 text-yellow-300" />
                      {skill.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-5 dark:bg-gray-800">
                <div className="mb-4">
                  <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 mb-2">
                    About
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-3 text-sm">
                    {skill.description}
                  </p>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {typeof skill.skills === "string"
                      ? skill.skills
                          .split(",")
                          .map((skillItem: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
                            >
                              {skillItem.trim()}
                            </span>
                          ))
                      : Array.isArray(skill.skills) &&
                        skill.skills.map((skillItem: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
                          >
                            {skillItem.trim()}
                          </span>
                        ))}
                  </div>
                </div>

                {/* Contact Now Button */}
                <button
                  onClick={() => navigate(`/skills/${skill.id}`)}
                  className="w-full py-2.5 border border-indigo-600 bg-gradient-to-r hover:text-white text-blue-700 dark:bg-gradient-to-r dark:from-blue-700 dark:to-indigo-800 dark:text-white rounded-lg font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <span>Contact Now</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                <svg
                  className="w-12 h-12 text-blue-500 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
              No other skills found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              You're currently the only one who has shared skills. Invite others
              to join and share their expertise!
            </p>
            <button
              onClick={() =>
                window.navigator.clipboard.writeText(window.location.href)
              }
              className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium shadow-sm transition-all border border-gray-200 dark:border-gray-600"
            >
              Copy Invite Link
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SkillList;

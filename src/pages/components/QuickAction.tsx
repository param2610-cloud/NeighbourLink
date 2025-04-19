import { useState, useEffect } from 'react';
import { Zap, Search, Bell , Users, BookOpen, Calendar } from 'lucide-react';
import { useMobileContext } from '@/contexts/MobileContext';
import { useNavigate } from 'react-router-dom';

interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    index: number;
    isOpen: boolean;
    totalItems: number;
}

export const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick, index, isOpen, totalItems }) => {
    // Calculate position in semicircle (180 degrees)
    const getPosition = () => {
        if (!isOpen) return { transform: 'translate(0, 0)' };

        // Distribute buttons in a semicircle (180 degrees) above the main button
        const angleRange = 119.6; // semicircle degrees
        const startAngle = -45.7 - (angleRange / 2); // Start from left (-90 degrees is top)
        const angle = startAngle + (index * (angleRange / (totalItems - 1))) * (Math.PI / 180);

        const radius = 140; // Distance from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return {
            transform: `translate(${x}px, ${y}px)`,
            opacity: 1
        };
    };

    return (
        <button
            className="
    absolute flex flex-col items-center justify-center 
    bg-gradient-to-tr from-gray-500 to-gray-600 
    p-5 rounded-full shadow-lg 
     duration-300 
    w-18 h-18 opacity-0 
    hover:bg-gradient-to-tr hover:from-gray-700 hover:to-gray-900 
    hover:shadow-2xl 
    hover:scale-110
    focus:outline-none focus:ring-4 focus:ring-gray-700
  "
            style={{
                ...getPosition(),
                transitionDelay: `${index * 50}ms`
            }}
            onClick={onClick}
            aria-label={label}
        >
            <div className="text-white">
                {icon}
            </div>
            <span className="text-[10px] mt-1 text-gray-300">{label}</span>
        </button>

    );
};

interface QuickActionsButtonProps {
    openModal: (type?: 'resource' | 'event' | 'promotion' | 'update') => void;
  }
  
  const QuickActionsButton: React.FC<QuickActionsButtonProps> = ({ openModal }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isMobile } = useMobileContext();
    const navigate = useNavigate()

    const toggleMenu = () => {
        if (!isModalOpen) {
            setIsModalOpen(true);
            setTimeout(() => setIsOpen(true), 100);
        } else {
            setIsOpen(false);
            setTimeout(() => setIsModalOpen(false), 500);
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isModalOpen) {
                setIsOpen(false);
                setTimeout(() => setIsModalOpen(false), 500);
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    const quickActions = [
        { icon: <Search size={20} />, label: 'Search', action: () => navigate("/search") },
        { icon: <BookOpen size={20} />, label: 'Resorce', action: () =>  openModal('resource')},
        // { icon: <Gift size={24} />, label: 'Offer', action: () => console.log('Offer clicked') },
        { icon: <Bell size={20} />, label: 'Promote', action: () => openModal('promotion') },
        { icon: <Calendar size={20} />, label: 'Event', action: () => openModal('event') },
        { icon: <Users size={20} />, label: 'Update', action: () => openModal('update') },
    ];

    const handleActionClick = (action: () => void) => {
        action();
        toggleMenu();
    };

    return (
        <div className={`fixed top-33 ${isMobile ? "right-5" : "right-20"} z-50`}>
            {/* Main button */}
            <button
                className={`p-4 rounded-full border-blue-600 text-neutral-900 dark:text-neutral-100 shadow-lg transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isOpen ? 'transform rotate-45' : ''}`}
                onClick={toggleMenu}
                aria-label="Quick Actions"
            >
                <Zap size={22} />
            </button>

            {/* Modal overlay */}
            {isModalOpen && (
                <div
                    className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`}
                    onClick={toggleMenu}
                >
                    {/* Actions container */}
                    <div
                        className={`fixed top-20 ${isMobile ? "right-20" : "right-30"} inset-0 pointer-events-none flex items-center justify-center`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute pointer-events-auto" style={{ top: 'calc(2rem + 32px)', right: '2rem' }}>
                            {/* Action buttons */}
                            {quickActions.map((action, index) => (
                                <QuickAction
                                    key={index}
                                    icon={action.icon}
                                    label={action.label}
                                    onClick={() => handleActionClick(action.action)}
                                    index={index}
                                    isOpen={isOpen}
                                    totalItems={quickActions.length}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default QuickActionsButton;
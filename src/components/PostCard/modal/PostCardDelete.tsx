import React from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'react-toastify';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemType: 'post' | 'sharedresource';
    onDelete: () => void;
}

const PostCardDelete: React.FC<DeleteModalProps> = ({
    isOpen,
    onClose,
    itemId,
    itemType,
    onDelete,
}) => {
    if (!isOpen) return null;

    const handleDelete = async () => {
        try {
            const collectionName = itemType === 'post' ? 'posts' : 'sharedResources';
            await deleteDoc(doc(db, collectionName, itemId));
            onDelete();
            onClose();
            console.log("Post Deleted Successfully");
            toast.success("Post Deleted Successfully",{position:"top-center"});
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/50 dark:bg-black/70"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative z-50 w-[90%] max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 sm:w-full">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    Confirm Deletion
                </h2>
                
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Are you sure you want to delete this {itemType === 'post' ? 'post' : 'shared resource'}? 
                    This action cannot be undone.
                </p>
                
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    
                    <button
                        onClick={handleDelete}
                        className="rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostCardDelete;
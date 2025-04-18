import React, { useEffect } from 'react';

interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    // phoneNumber?: string;
    photoURL?: string;
}

interface ContactResponderProps {
    isOpen: boolean;
    onClose: () => void;
    responder: UserData;
    postTitle: string;
    currentUserId: string;
}

const ContactResponder: React.FC<ContactResponderProps> = ({
    isOpen,
    onClose,
    responder,
    postTitle,
    // currentUserId
}) => {
    // const [message, setMessage] = useState<string>('');
    // const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();

    //     // if (!message.trim()) {
    //     //     toast.error("Please enter a message", {
    //     //         position: "top-center",
    //     //     });
    //     //     return;
    //     // }

    //     // setLoading(true);

    //     // try {
    //     //     // Get current user info
    //     //     const currentUserDoc = await getDoc(doc(db, "Users", currentUserId));
    //     //     const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : null;

    //     //     // Create a new message document
    //     //     await addDoc(collection(db, "messages"), {
    //     //         senderId: currentUserId,
    //     //         senderName: currentUserData ? `${currentUserData.firstName} ${currentUserData.lastName}` : "Unknown User",
    //     //         senderEmail: currentUserData?.email || "No email",
    //     //         senderPhoto: currentUserData?.photoURL || null,
    //     //         recipientId: responder.id,
    //     //         recipientName: `${responder.firstName} ${responder.lastName}`,
    //     //         recipientEmail: responder.email,
    //     //         postTitle: postTitle,
    //     //         message: message,
    //     //         read: false,
    //     //         createdAt: serverTimestamp()
    //     //     });

    //     //     toast.success("Message sent successfully!", {
    //     //         position: "top-center",
    //     //     });

    //     //     setMessage('');
    //     //     onClose();

    //     // } catch (error) {
    //     //     console.error("Error sending message:", error);
    //     //     toast.error("Failed to send message. Please try again.", {
    //     //         position: "top-center",
    //     //     });
    //     // } finally {
    //     //     setLoading(false);
    //     // }
    // };
    useEffect(()=>{
        console.log(responder);
    })

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="relative w-11/12 max-w-md p-6 mx-auto rounded-lg shadow-xl bg-white dark:bg-neutral-800 max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Contact {responder.firstName}</h2>

                {/* Responder info */}
                <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-gray-100 dark:bg-neutral-700">
                    <img
                        src={responder.photoURL || "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
                        alt={`${responder.firstName}'s profile`}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {responder.firstName} {responder.lastName}
                        </p>

                    </div>
                </div>
                    <div className='flex items-center gap-2 mb-2'>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Email-id:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{responder.email}</p>
                    </div>
                    {/* <div className='flex items-center gap-2 mb-4'>
                        <p className="font-medium text-gray-900 dark:text-white">
                            Contact on mobile:
                        </p>

                        // {/* <p className="text-sm text-gray-600 dark:text-gray-300">{responder.phoneNumber ? responder.phoneNumber : 'Mobile not available'}</p> */}
                    {/* </div> */} 

                {/* Post reference */}
                <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Regarding post: <span className="font-medium">{postTitle}</span>
                    </p>
                </div>

                {/* Message form */}
                {/* <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label 
                            htmlFor="message" 
                            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            rows={5}
                            className="w-full px-3 py-2 text-gray-700 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-neutral-700 dark:border-neutral-600"
                            placeholder="Write your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </span>
                            ) : 'Send Message'}
                        </button>
                    </div>
                </form> */}
            </div>
        </div>
    );
};

export default ContactResponder;
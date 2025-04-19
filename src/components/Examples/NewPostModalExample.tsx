import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import NewPostForm from '@/components/Forms/NewPostForm';

const NewPostModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postType, setPostType] = useState<'resource' | 'event' | 'promotion' | 'update' | null>(null);

  const openModal = (type?: 'resource' | 'event' | 'promotion' | 'update') => {
    setPostType(type || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    console.log('Post created successfully!');
    // You can implement additional success handling here
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => openModal()}>
          Create Any Post
        </Button>
        
        <Button variant="outline" onClick={() => openModal('resource')}>
          Create Resource Post
        </Button>
        
        <Button variant="outline" onClick={() => openModal('event')}>
          Create Event Post
        </Button>
        
        <Button variant="outline" onClick={() => openModal('promotion')}>
          Create Promotion Post
        </Button>
        
        <Button variant="outline" onClick={() => openModal('update')}>
          Create Update Post
        </Button>
      </div>

      <NewPostForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        initialPostType={postType}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default NewPostModalExample;

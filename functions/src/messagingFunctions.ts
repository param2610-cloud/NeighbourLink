import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Handle new chat messages and send notifications
export const onNewMessage = functions.firestore
  .onDocumentCreated('conversations/{conversationId}/messages/{messageId}', 
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('Event data is undefined');
      return;
    }
    const messageData = snapshot.data();
    const { conversationId, messageId } = event.params;
    
    // Skip if it's a system message
    if (messageData.system) {
      return;
    }
    
    try {
      // Get the conversation to find participants
      const conversationRef = admin.firestore().collection('conversations').doc(conversationId);
      const conversationSnapshot = await conversationRef.get();
      
      if (!conversationSnapshot.exists) {
        console.log(`Conversation ${conversationId} does not exist`);
        return;
      }
      
      const conversationData = conversationSnapshot.data();
      if (!conversationData) return;
      
      // Find recipient (everyone except sender)
      const recipientIds = conversationData.participants.filter(
        (participantId: string) => participantId !== messageData.senderId
      );
      
      if (recipientIds.length === 0) {
        console.log('No recipients found');
        return;
      }
      
      // Get sender information for notification title
      const senderRef = admin.firestore().collection('Users').doc(messageData.senderId);
      const senderSnapshot = await senderRef.get();
      const senderData = senderSnapshot.exists ? senderSnapshot.data() : null;
      
      const senderName = senderData?.displayName || 
                       `${senderData?.firstName || ''} ${senderData?.lastName || ''}`.trim() || 
                       'User';
      
      // Create message preview
      const messageText = messageData.text || '';
      const messagePreview = messageText.length > 50 ? 
        messageText.substring(0, 47) + '...' : 
        messageText;
      
      // Send notification to each recipient
      for (const recipientId of recipientIds) {
        // Get recipient's FCM token
        const recipientRef = admin.firestore().collection('Users').doc(recipientId);
        const recipientSnapshot = await recipientRef.get();
        
        if (!recipientSnapshot.exists) {
          console.log(`Recipient ${recipientId} not found`);
          continue;
        }
        
        const recipientData = recipientSnapshot.data();
        if (!recipientData || !recipientData.fcmToken) {
          console.log(`No FCM token for recipient ${recipientId}`);
          continue;
        }
        
        // Send the notification
        await admin.messaging().send({
          token: recipientData.fcmToken,
          notification: {
            title: `New message from ${senderName}`,
            body: messagePreview || 'You received a new message',
          },
          data: {
            type: 'chat_message',
            chatId: conversationId,
            senderId: messageData.senderId,
            messageId: messageId
          }
        });
        
        console.log(`Notification sent to recipient ${recipientId}`);
      }
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  });

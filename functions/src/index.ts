import * as functions from 'firebase-functions';
import * as v1 from 'firebase-functions/v1'; // Explicitly import v1 namespace
import * as admin from 'firebase-admin';

admin.initializeApp();

// Firebase Cloud Function to send notifications
export const sendNotification = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { token, notification, data } = req.body;
    
    if (!token || !notification) {
      res.status(400).send({ error: 'Missing required parameters' });
      return;
    }
    
    // Send the message
    await admin.messaging().send({
      token,
      notification,
      data
    });
    
    res.status(200).send({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send({ error: 'Failed to send notification' });
  }
});

// Automatically send notifications when a new emergency post is created
// Use v1 namespace explicitly for the document method
export const onEmergencyPost = v1.firestore
  .document('posts/{postId}')
  .onCreate(async (snapshot, context) => {
    const postData = snapshot.data();
    const postId = context.params.postId;
    
    // Check if it's an emergency post
    if (postData.urgencyLevel === 3) {
      // Get all users with emergency notifications enabled within the visibility radius
      const usersSnapshot = await admin.firestore()
        .collection('Users')
        .where('notifyEmergency', '==', true)
        .get();
      
      const notifications: admin.messaging.Message[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Only send to users who have FCM tokens
        if (userData.fcmToken) {
          // Calculate distance if both coordinates are available
          let shouldSend = true;
          
          if (postData.coordinates && userData.coordinates) {
            const distance = calculateDistance(
              postData.coordinates.lat,
              postData.coordinates.lng,
              userData.coordinates.lat,
              userData.coordinates.lng
            );
            
            // Only send if user is within the post's visibility radius
            shouldSend = distance <= postData.visibilityRadius;
          }
          
          if (shouldSend) {
            notifications.push({
              token: userData.fcmToken,
              notification: {
                title: 'Emergency Alert!',
                body: postData.title || 'Emergency in your area'
              },
              data: {
                type: 'emergency_alert',
                postId: postId
              }
            });
          }
        }
      }
      
      // Send all notifications
      const notificationPromises = notifications.map(notification => 
        admin.messaging().send(notification)
      );
      
      await Promise.all(notificationPromises);
    }
  });

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Add a function to handle new chat messages
export const onNewChatMessage = v1.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    try {
      const messageData = snapshot.data();
      const { conversationId } = context.params;
      
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
            body: messagePreview || 'You have a new message'
          },
          data: {
            type: 'chat_message',
            chatId: conversationId,
            senderId: messageData.senderId
          }
        });
      }
    } catch (error) {
      console.error('Error sending chat notification:', error);
    }
  });

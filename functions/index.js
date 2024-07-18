const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onGameUpdate = functions.firestore
    .document('games/{gameId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        if (newValue.result && newValue.result !== previousValue.result) {
            const userId = newValue.userId;
            const friendId = newValue.friendId; // Annahme: friendId ist im Spiel-Dokument gespeichert

            const userDoc = await admin.firestore().collection('users').doc(userId).get();
            const friendDoc = await admin.firestore().collection('users').doc(friendId).get();

            const userData = userDoc.data();
            const friendData = friendDoc.data();

            const userMessage = newValue.result === 'won' ? 'You won! Your opponent lost!' : 'You lost! Your opponent won!';
            const friendMessage = newValue.result === 'lost' ? 'You won! Your friend lost!' : 'You lost! Your friend won!';

            await admin.firestore().collection('notifications').add({
                to: userId,
                message: userMessage,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            await admin.firestore().collection('notifications').add({
                to: friendId,
                message: friendMessage,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    });

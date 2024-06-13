// Initialize Firebase
var firebaseConfig = {
    apiKey: "AIzaSyAIwf6RVzexCZ0LMfmEFIFBq5YsHm5-lnM",
    authDomain: "codeduels-1b79f.firebaseapp.com",
    projectId: "codeduels-1b79f",
    storageBucket: "codeduels-1b79f.appspot.com",
    messagingSenderId: "927315184082",
    appId: "1:927315184082:web:e115d2bdc6465ffea6a00b",
    measurementId: "G-6Z7PS1DT05"
};
firebase.initializeApp(firebaseConfig);

// Firebase Authentication and Firestore
var auth = firebase.auth();
var db = firebase.firestore();

// Function to search for users
function searchUsers(username) {
    console.log(`Searching for users with username: ${username}`);
    db.collection('users').where('username', '==', username).get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                console.log('No users found with that username');
                document.getElementById('search-results').innerHTML = 'No users found with that username';
                return;
            }
            querySnapshot.forEach(doc => {
                var userData = doc.data();
                document.getElementById('search-results').innerHTML = `
                    <div class="user-result">
                        <p>${userData.username} (${userData.email})</p>
                        <button onclick="sendFriendRequest('${doc.id}')">Send Friend Request</button>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error searching for users:', error);
        });
}

// Function to send a friend request
function sendFriendRequest(toUserId) {
    const fromUserId = auth.currentUser.uid;
    db.collection('friendRequests').add({
        from: fromUserId,
        to: toUserId,
        status: 'pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Friend request sent');
        document.getElementById('search-results').innerHTML = 'Friend request sent';
    })
    .catch(error => {
        console.error('Error sending friend request:', error);
    });
}

// Add event listener to search form
document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('search-username').value;
    searchUsers(username);
});

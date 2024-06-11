// Firebase Configuration
var firebaseConfig = {
    apiKey: "AIzaSyAIwf6RVzexCZ0LMfmEFIFBq5YsHm5-lnM",
    authDomain: "codeduels-1b79f.firebaseapp.com",
    projectId: "codeduels-1b79f",
    storageBucket: "codeduels-1b79f.appspot.com",
    messagingSenderId: "927315184082",
    appId: "1:927315184082:web:e115d2bdc6465ffea6a00b",
    measurementId: "G-6Z7PS1DT05"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Authentication and Firestore
var auth = firebase.auth();
var db = firebase.firestore();

// Logout function
function logout() {
    auth.signOut().then(function () {
        console.log('User signed out');
        window.location.href = 'index.html'; // Redirect to homepage after logout
    }).catch(function (error) {
        console.error('Error signing out:', error);
    });
}

// Function to search for users
function searchUsers() {
    const searchField = document.getElementById('search-field').value;
    const searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = '';
    console.log('Searching for users with username:', searchField);

    db.collection('users').where('username', '>=', searchField).where('username', '<=', searchField + '\uf8ff')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                searchResultsContainer.innerHTML = '<p>No users found</p>';
                return;
            }

            snapshot.forEach(doc => {
                const userData = doc.data();
                console.log('Found user:', userData);
                const userDiv = document.createElement('div');
                userDiv.innerHTML = `
                    <span>${userData.username}</span>
                    <button onclick="sendFriendRequest('${doc.id}')">Add Friend</button>
                `;
                searchResultsContainer.appendChild(userDiv);
            });
        }).catch(error => {
            console.error('Error searching for users: ', error);
            searchResultsContainer.innerHTML = '<p>Error searching for users</p>';
        });
}

// Function to send a friend request
function sendFriendRequest(recipientId) {
    const user = auth.currentUser;
    if (user) {
        db.collection('friendRequests').add({
            from: user.uid,
            to: recipientId,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert('Friend request sent!');
        }).catch(error => {
            console.error('Error sending friend request: ', error);
        });
    } else {
        alert('You must be logged in to send a friend request.');
    }
}

// Function to fetch and display friends
function fetchFriends() {
    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).collection('friends')
            .onSnapshot(snapshot => {
                const friendsListContainer = document.getElementById('friends-list');
                friendsListContainer.innerHTML = ''; // Clear the list before appending new data
                snapshot.forEach(doc => {
                    const friendData = doc.data();
                    const friendDiv = document.createElement('div');
                    friendDiv.innerHTML = `<span>${friendData.username}</span>`;
                    friendsListContainer.appendChild(friendDiv);
                });
            });
    }
}

// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User is signed in:', user);
        fetchFriends();
    } else {
        console.log('No user is signed in.');
        window.location.href = 'login.html'; // Redirect to login page if not signed in
    }
});

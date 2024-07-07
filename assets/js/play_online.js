document.addEventListener('DOMContentLoaded', function () {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Fetch and display friend requests
    function loadFriendRequests(userId) {
        db.collection('friend_requests').where('to', '==', userId)
            .get()
            .then((querySnapshot) => {
                const friendRequestsList = document.getElementById('friend-requests-list');
                friendRequestsList.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const request = doc.data();
                    const listItem = document.createElement('div');
                    listItem.classList.add('friend-request');
                    listItem.innerHTML = `
                        <p><strong>${request.fromUsername}</strong> wants to be your friend</p>
                        <button onclick="acceptFriendRequest('${doc.id}', '${request.from}', this)">Accept</button>
                        <button onclick="rejectFriendRequest('${doc.id}', this)">Reject</button>
                    `;
                    friendRequestsList.appendChild(listItem);
                });
            })
            .catch((error) => {
                console.error('Error getting friend requests: ', error);
            });
    }

    // Fetch and display friends
    function loadFriends(userId) {
        db.collection('users').doc(userId).get()
            .then((doc) => {
                const userData = doc.data();
                const friendsList = document.getElementById('friends-list');
                friendsList.innerHTML = '';
                if (userData.friends && userData.friends.length > 0) {
                    userData.friends.forEach((friendId) => {
                        db.collection('users').doc(friendId).get().then((friendDoc) => {
                            const friendData = friendDoc.data();
                            const listItem = document.createElement('div');
                            listItem.classList.add('friend');
                            listItem.innerHTML = `
                                <p>${friendData.username}</p>
                                <button onclick="removeFriend('${friendId}', this)">Remove</button>
                            `;
                            friendsList.appendChild(listItem);
                        });
                    });
                } else {
                    friendsList.innerHTML = '<p>You have no friends yet.</p>';
                }
            })
            .catch((error) => {
                console.error('Error getting friends list: ', error);
            });
    }

    // Handle friend request form submission
    document.getElementById('send-request-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showPopup('Please sign in to send a friend request.');
            return;
        }

        const friendUsername = document.getElementById('friend-username').value;

        // Check if the user with the given username exists
        db.collection('users').where('username', '==', friendUsername).get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    showPopup('No user found with that username.');
                    return;
                }

                const friendDoc = querySnapshot.docs[0];
                const friendId = friendDoc.id;

                // Check if they are already friends
                db.collection('users').doc(user.uid).get().then((userDoc) => {
                    const userData = userDoc.data();
                    if (userData.friends && userData.friends.includes(friendId)) {
                        showPopup('You are already friends with this user.');
                        return;
                    }

                    // Create a friend request
                    db.collection('friend_requests').add({
                        from: user.uid,
                        fromUsername: user.displayName,
                        to: friendId
                    }).then(() => {
                        showPopup('Friend request sent!');
                    }).catch((error) => {
                        console.error('Error sending friend request: ', error);
                        showPopup('Error sending friend request: ' + error.message);
                    });
                });
            }).catch((error) => {
                console.error('Error finding user: ', error);
            });
    });

    // Accept friend request
    window.acceptFriendRequest = function (requestId, fromId, button) {
        const user = auth.currentUser;
        const userRef = db.collection('users').doc(user.uid);
        const fromUserRef = db.collection('users').doc(fromId);

        // Add each other as friends
        userRef.update({
            friends: firebase.firestore.FieldValue.arrayUnion(fromId)
        }).then(() => {
            fromUserRef.update({
                friends: firebase.firestore.FieldValue.arrayUnion(user.uid)
            }).then(() => {
                // Remove the friend request
                db.collection('friend_requests').doc(requestId).delete().then(() => {
                    const requestElement = button.parentElement;
                    requestElement.remove();
                    loadFriends(user.uid);
                    showPopup('Friend request accepted!');
                    // Notify the other user
                    socket.send(JSON.stringify({
                        type: 'friendAccepted',
                        userId: fromId
                    }));
                }).catch((error) => {
                    console.error('Error removing friend request: ', error);
                });
            }).catch((error) => {
                console.error('Error adding friend: ', error);
            });
        }).catch((error) => {
            console.error('Error adding friend: ', error);
        });
    };

    // Reject friend request
    window.rejectFriendRequest = function (requestId, button) {
        const user = auth.currentUser;

        // Remove the friend request
        db.collection('friend_requests').doc(requestId).delete().then(() => {
            const requestElement = button.parentElement;
            requestElement.remove();
            showPopup('Friend request rejected.');
        }).catch((error) => {
            console.error('Error removing friend request: ', error);
        });
    };

    // Remove friend
    window.removeFriend = function (friendId, button) {
        const user = auth.currentUser;
        const userRef = db.collection('users').doc(user.uid);
        const friendRef = db.collection('users').doc(friendId);

        // Remove friend from user's friend list
        userRef.update({
            friends: firebase.firestore.FieldValue.arrayRemove(friendId)
        }).then(() => {
            // Remove user from friend's friend list
            friendRef.update({
                friends: firebase.firestore.FieldValue.arrayRemove(user.uid)
            }).then(() => {
                const friendElement = button.parentElement;
                friendElement.remove();
                showPopup('Friend removed.');
                // Notify the other user
                socket.send(JSON.stringify({
                    type: 'friendRemoved',
                    userId: friendId
                }));
            }).catch((error) => {
                console.error('Error removing friend: ', error);
            });
        }).catch((error) => {
            console.error('Error removing friend: ', error);
        });
    };

    // Function to show popup
    function showPopup(message) {
        const popup = document.getElementById('popup');
        const popupMessage = document.getElementById('popup-message');
        const overlay = document.querySelector('.popup-overlay');

        popupMessage.textContent = message;
        popup.style.display = 'block';
        overlay.style.display = 'block';
    }

    // Function to close popup
    window.closePopup = function () {
        const popup = document.getElementById('popup');
        const overlay = document.querySelector('.popup-overlay');

        popup.style.display = 'none';
        overlay.style.display = 'none';
    };

    // WebSocket connection
    const socket = new WebSocket('ws://localhost:5000');

    socket.addEventListener('open', (event) => {
        console.log('Connected to WebSocket server');
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'friendRequest') {
            loadFriendRequests(auth.currentUser.uid);
        } else if (data.type === 'friendAccepted') {
            loadFriends(auth.currentUser.uid);
        } else if (data.type === 'friendRemoved') {
            loadFriends(auth.currentUser.uid);
        }
    });

    // Check the authentication state
    auth.onAuthStateChanged(function (user) {
        if (user) {
            document.getElementById('login-button').style.display = 'none';
            document.getElementById('signup-button').style.display = 'none';
            document.getElementById('logout-button').style.display = 'block';
            document.getElementById('profile-link').style.display = 'block';
            document.getElementById('settings-link').style.display = 'block';
            loadFriendRequests(user.uid);
            loadFriends(user.uid);
        } else {
            document.getElementById('login-button').style.display = 'block';
            document.getElementById('signup-button').style.display = 'block';
            document.getElementById('logout-button').style.display = 'none';
            document.getElementById('profile-link').style.display = 'none';
            document.getElementById('settings-link').style.display = 'none';
        }
    });
});

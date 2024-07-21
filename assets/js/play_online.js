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
                    db.collection('users').doc(request.from).get().then((userDoc) => {
                        const fromUsername = userDoc.data().username;
                        const listItem = document.createElement('div');
                        listItem.classList.add('friend-request');
                        listItem.innerHTML = `
                            <p><strong>${fromUsername}</strong> wants to be your friend</p>
                            <button class="btn accept-btn" onclick="acceptFriendRequest('${doc.id}', '${request.from}', this)">Accept</button>
                            <button class="btn reject-btn" onclick="rejectFriendRequest('${doc.id}', this)">Reject</button>
                        `;
                        friendRequestsList.appendChild(listItem);
                    }).catch((error) => {
                        console.error('Error getting user data: ', error);
                    });
                });
            })
            .catch((error) => {
                console.error('Error getting friend requests: ', error);
            });
    }

    // Delete all friend requests
    window.deleteAllRequests = function () {
        const user = auth.currentUser;
        if (!user) {
            showPopup('Please sign in to delete friend requests.');
            return;
        }

        db.collection('friend_requests').where('to', '==', user.uid).get()
            .then((querySnapshot) => {
                const batch = db.batch();
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            })
            .then(() => {
                loadFriendRequests(user.uid);
                showPopup('All friend requests deleted.');
            })
            .catch((error) => {
                console.error('Error deleting friend requests: ', error);
            });
    };

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
                                <div class="friend-info">
                                    <p>${friendData.username}</p>
                                </div>
                                <div class="btn-group">
                                    <button class="btn" onclick="requestDuel('${friendId}', 'java')">Request Java Duel 1v1</button>
                                    <button class="btn" onclick="requestDuel('${friendId}', 'javascript')">Request JavaScript Duel 1v1</button>
                                    <button class="btn" onclick="requestDuel('${friendId}', 'python')">Request Python Duel 1v1</button>
                                    <button class="btn remove-btn" onclick="removeFriend('${friendId}', this)">Remove</button>
                                </div>
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

    // Request a duel
    window.requestDuel = function (friendId, language) {
        const user = auth.currentUser;
        if (!user) {
            showPopup('Please sign in to request a duel.');
            return;
        }

        const duelRequest = {
            from: user.uid,
            to: friendId,
            language: language,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('duel-requests').add(duelRequest)
            .then(() => {
                showPopup('Duel request sent!');
                listenForDuelAcceptance(user.uid, friendId, language); // Listen for duel acceptance
            })
            .catch((error) => {
                console.error('Error sending duel request: ', error);
                showPopup('Error sending duel request: ' + error.message);
            });
    };

    // Listen for duel acceptance
    function listenForDuelAcceptance(userId, friendId, language) {
        db.collection('duel-requests')
            .where('from', '==', userId)
            .where('to', '==', friendId)
            .where('language', '==', language)
            .onSnapshot((snapshot) => {
                snapshot.forEach((doc) => {
                    if (doc.data().accepted) {
                        startDuel(language, doc.id);
                    }
                });
            });
    }

    // Fetch and display duel requests
    function loadDuelRequests(userId) {
        db.collection('duel-requests').where('to', '==', userId)
            .get()
            .then((querySnapshot) => {
                const duelRequestsList = document.getElementById('duel-requests-list');
                duelRequestsList.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const request = doc.data();
                    db.collection('users').doc(request.from).get().then((userDoc) => {
                        const fromUsername = userDoc.data().username;
                        const listItem = document.createElement('div');
                        listItem.classList.add('duel-request');
                        listItem.innerHTML = `
                            <p><strong>${fromUsername}</strong> invited you to a ${request.language} duel</p>
                            <button class="btn" onclick="acceptDuel('${doc.id}', '${request.language}')">Start ${request.language} Duel</button>
                        `;
                        duelRequestsList.appendChild(listItem);
                    }).catch((error) => {
                        console.error('Error getting user data: ', error);
                    });
                });
            })
            .catch((error) => {
                console.error('Error getting duel requests: ', error);
            });
    }

    // Accept a duel request
    window.acceptDuel = function (requestId, language) {
        db.collection('duel-requests').doc(requestId).update({ accepted: true })
            .then(() => {
                startDuel(language, requestId);
            }).catch((error) => {
                console.error('Error accepting duel request: ', error);
                showPopup('Error accepting duel request: ' + error.message);
            });
    };

    // Start a duel and delete the request
    window.startDuel = function (language, requestId) {
        let duelPage;
        switch (language) {
            case 'java':
                duelPage = 'play_with_friends_java/friends.html';
                break;
            case 'javascript':
                duelPage = 'play_with_friends_javascript/friends.html';
                break;
            case 'python':
                duelPage = 'play_with_friends_python/friends.html';
                break;
            default:
                showPopup('Invalid language selected.');
                return;
        }

        // Delete the duel request
        db.collection('duel-requests').doc(requestId).delete().then(() => {
            window.location.href = duelPage;
        }).catch((error) => {
            console.error('Error deleting duel request: ', error);
            showPopup('Error starting duel: ' + error.message);
        });
    };

    // Delete all duel requests
    window.deleteAllDuelRequests = function () {
        const user = auth.currentUser;
        if (!user) {
            showPopup('Please sign in to delete duel requests.');
            return;
        }

        db.collection('duel-requests').where('to', '==', user.uid).get()
            .then((querySnapshot) => {
                const batch = db.batch();
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            })
            .then(() => {
                loadDuelRequests(user.uid);
                showPopup('All duel requests deleted.');
            })
            .catch((error) => {
                console.error('Error deleting duel requests: ', error);
            });
    };

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
                
                                    // Check if there is already a pending or rejected friend request
                                    db.collection('friend_requests')
                                        .where('from', '==', user.uid)
                                        .where('to', '==', friendId)
                                        .get()
                                        .then((existingRequests) => {
                                            if (!existingRequests.empty) {
                                                showPopup('You have already sent a friend request to this user.');
                                                return;
                                            }
                
                                            // Create a friend request
                                            db.collection('friend_requests').add({
                                                from: user.uid,
                                                fromUsername: user.displayName,
                                                to: friendId,
                                                status: 'pending'
                                            }).then(() => {
                                                showPopup('Friend request sent!');
                                            }).catch((error) => {
                                                console.error('Error sending friend request: ', error);
                                                showPopup('Error sending friend request: ' + error.message);
                                            });
                                        }).catch((error) => {
                                            console.error('Error checking existing friend requests: ', error);
                                        });
                                }).catch((error) => {
                                    console.error('Error finding user: ', error);
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
                                const friendElement = button.parentElement.parentElement;
                                friendElement.remove();
                                showPopup('Friend removed.');
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
                            loadDuelRequests(user.uid);
                        } else {
                            document.getElementById('login-button').style.display = 'block';
                            document.getElementById('signup-button').style.display = 'block';
                            document.getElementById('logout-button').style.display = 'none';
                            document.getElementById('profile-link').style.display = 'none';
                            document.getElementById('settings-link').style.display = 'none';
                        }
                    });
                });
                

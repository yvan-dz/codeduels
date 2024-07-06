document.addEventListener('DOMContentLoaded', function () {
    const db = firebase.firestore();

    // Fetch and display friend requests
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            db.collection('friend_requests').where('to', '==', user.uid)
                .onSnapshot(querySnapshot => {
                    const friendRequestsList = document.getElementById('friend-requests-list');
                    friendRequestsList.innerHTML = '';
                    querySnapshot.forEach(doc => {
                        const request = doc.data();
                        const requestElement = document.createElement('div');
                        requestElement.classList.add('friend-request');
                        requestElement.innerHTML = `
                            <p>Friend request from: ${request.fromUsername}</p>
                            <button data-request-id="${doc.id}" data-from="${request.from}" class="accept-request">Accept</button>
                            <button data-request-id="${doc.id}" data-from="${request.from}" class="reject-request">Reject</button>
                        `;
                        friendRequestsList.appendChild(requestElement);
                    });

                    document.querySelectorAll('.accept-request').forEach(button => {
                        button.addEventListener('click', function () {
                            const requestId = this.dataset.requestId;
                            const fromId = this.dataset.from;
                            acceptFriendRequest(requestId, fromId, user.uid);
                        });
                    });

                    document.querySelectorAll('.reject-request').forEach(button => {
                        button.addEventListener('click', function () {
                            const requestId = this.dataset.requestId;
                            rejectFriendRequest(requestId);
                        });
                    });
                });

            // Fetch and display friends list
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const friendsList = document.getElementById('friends-list');
                    friendsList.innerHTML = '';
                    userData.friends.forEach(friendId => {
                        db.collection('users').doc(friendId).get().then(friendDoc => {
                            if (friendDoc.exists) {
                                const friendData = friendDoc.data();
                                const friendElement = document.createElement('div');
                                friendElement.classList.add('friend');
                                friendElement.innerHTML = `<p>${friendData.username}</p>`;
                                friendsList.appendChild(friendElement);
                            }
                        });
                    });
                } else {
                    console.log('No such document!');
                }
            }).catch(error => {
                console.error('Error getting friends list:', error);
            });
        }
    });

    // Handle sending friend requests
    document.getElementById('send-request-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to send a friend request.');
            return;
        }

        const username = document.getElementById('username').value;

        db.collection('users').where('username', '==', username).get().then(querySnapshot => {
            if (!querySnapshot.empty) {
                const recipient = querySnapshot.docs[0].data();
                db.collection('friend_requests').add({
                    from: user.uid,
                    fromUsername: user.displayName,
                    to: recipient.uid,
                    status: 'pending'
                }).then(() => {
                    alert('Friend request sent!');
                }).catch(error => {
                    console.error('Error sending friend request:', error);
                    alert('Error sending friend request: ' + error.message);
                });
            } else {
                alert('User not found');
            }
        });
    });

    // Accept friend request function
    function acceptFriendRequest(requestId, fromId, toId) {
        db.collection('friend_requests').doc(requestId).update({
            status: 'accepted'
        }).then(() => {
            alert('Friend request accepted!');
            // Add to friends list
            db.collection('users').doc(toId).update({
                friends: firebase.firestore.FieldValue.arrayUnion(fromId)
            });
            db.collection('users').doc(fromId).update({
                friends: firebase.firestore.FieldValue.arrayUnion(toId)
            });
        }).catch(error => {
            console.error('Error accepting friend request:', error);
            alert('Error accepting friend request: ' + error.message);
        });
    }

    // Reject friend request function
    function rejectFriendRequest(requestId) {
        db.collection('friend_requests').doc(requestId).delete().then(() => {
            alert('Friend request rejected.');
        }).catch(error => {
            console.error('Error rejecting friend request:', error);
            alert('Error rejecting friend request: ' + error.message);
        });
    }

    // Logout function
    function logout() {
        firebase.auth().signOut().then(() => {
            console.log('User signed out');
        }).catch(error => {
            console.error('Error signing out:', error);
        });
    }

    // Expose the logout function to the global scope
    window.logout = logout;
});

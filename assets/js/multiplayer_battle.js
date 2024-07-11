document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Firestore
    const db = firebase.firestore();

    // Function to load the friends list
    function loadFriendsList(userId) {
        db.collection('users').doc(userId).get().then((userDoc) => {
            const userData = userDoc.data();
            if (userData.friends && userData.friends.length > 0) {
                const friendsListContainer = document.getElementById('friends-list-container');
                const friendsList = document.getElementById('friends-list');
                friendsList.innerHTML = '';

                userData.friends.forEach((friendId) => {
                    db.collection('users').doc(friendId).get().then((friendDoc) => {
                        const friendData = friendDoc.data();
                        const friendItem = document.createElement('li');
                        friendItem.innerHTML = `
                            <span>${friendData.name}</span>
                            <button onclick="startDuel('${friendId}')">Duel</button>
                        `;
                        friendsList.appendChild(friendItem);
                    });
                });

                friendsListContainer.style.display = 'block';
            } else {
                alert('You have no friends to duel with.');
            }
        });
    }

    // Function to start a duel
    window.startDuel = function(friendId) {
        // You can save the friendId to localStorage or a global variable and redirect
        localStorage.setItem('duelFriendId', friendId);
        window.location.href = 'play_with_friends/friends.html';
    };

    // Listen for the "Start Java Battle" button click
    const startJavaBattleBtn = document.getElementById('start-java-battle');
    startJavaBattleBtn.addEventListener('click', function () {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                loadFriendsList(user.uid);
            } else {
                alert('You need to sign in first.');
            }
        });
    });
});

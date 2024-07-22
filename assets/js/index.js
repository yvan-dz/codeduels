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

// Check auth state and update UI
auth.onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in
        var docRef = db.collection("users").doc(user.uid);
        docRef.get().then(function (doc) {
            if (doc.exists) {
                var userData = doc.data();
                document.getElementById('welcome-message').innerText = `Welcome, ${userData.username}!`;
                document.getElementById('logout-button').style.display = 'block';
                document.getElementById('login-button').style.display = 'none';
                document.getElementById('signup-button').style.display = 'none';
                document.getElementById('profile-link').style.display = 'inline';
                document.getElementById('settings-link').style.display = 'inline';
                document.getElementById('friends-link').href = "multiplayer_battle.html";
                document.getElementById('online-link').href = "play_online.html";
                document.getElementById('hackathons-link').href = "hackathon.html";
            } else {
                console.log('No such document!');
            }
        }).catch(function (error) {
            console.error('Error getting document:', error);
        });
    } else {
        // No user is signed in
        document.getElementById('welcome-message').innerText = 'It\'s time to duel!';
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('login-button').style.display = 'inline';
        document.getElementById('signup-button').style.display = 'inline';
        document.getElementById('profile-link').style.display = 'none';
        document.getElementById('settings-link').style.display = 'none';
        document.getElementById('friends-link').href = "login.html";
        document.getElementById('online-link').href = "login.html";
        document.getElementById('hackathons-link').href = "login.html";
    }
});

// Logout function
function logout() {
    auth.signOut().then(function () {
        console.log('User signed out');
        window.location.href = 'index.html';  // Redirect to homepage after logout
    }).catch(function (error) {
        console.error('Error signing out:', error);
        alert('Error signing out: ' + error.message); // Display error message
    });
}
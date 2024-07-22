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

// Rank definitions
const ranks = [
    { name: 'Baby', requiredWins: 0 },
    { name: 'Student', requiredWins: 5 },
    { name: 'Genin', requiredWins: 15 },
    { name: 'Chunin', requiredWins: 20 },
    { name: 'Jonin', requiredWins: 30 },
    { name: 'Akatsuki', requiredWins: 45 },
    { name: 'Hokage', requiredWins: 60 },
    { name: 'Legend', requiredWins: 80 },
    { name: 'Rikoudo Sennin', requiredWins: 100 }
];

// Get rank based on completed challenges
function getRank(completedChallenges) {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (completedChallenges >= ranks[i].requiredWins) {
            return ranks[i].name;
        }
    }
    return 'Baby';
}

// Format date to dd.mm.yyyy
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Get the currently signed-in user
auth.onAuthStateChanged(function(user) {
    if (user) {
        var docRef = db.collection("users").doc(user.uid);
        docRef.get().then(function(doc) {
            if (doc.exists) {
                var userData = doc.data();
                document.getElementById('username').innerText = userData.username || 'N/A';
                document.getElementById('email').innerText = userData.email || 'N/A';
                
                if (userData.joinDate) {
                    var joinDate = userData.joinDate.toDate();
                    document.getElementById('join-date').innerText = formatDate(joinDate);
                } else {
                    document.getElementById('join-date').innerText = 'N/A';
                }

                const completedChallenges = userData.completedChallenges || 0;
                document.getElementById('completed-challenges').innerText = completedChallenges;
                document.getElementById('user-rank').innerText = getRank(completedChallenges);

                // Show profile and settings links
                document.getElementById('profile-link').style.display = 'inline';
                document.getElementById('settings-link').style.display = 'inline';

                // Show logout button
                document.getElementById('login-button').style.display = 'none';
                document.getElementById('signup-button').style.display = 'none';
                document.getElementById('logout-button').style.display = 'inline';
            } else {
                console.log('No such document!');
            }
        }).catch(function(error) {
            console.error('Error getting document:', error);
        });
    } else {
        // No user is signed in
        window.location.href = 'login.html';  // Redirect to login page if not signed in
    }
});

// Logout function
function logout() {
    auth.signOut().then(function() {
        console.log('User signed out');
        window.location.href = 'index.html';  // Redirect to homepage after logout
    }).catch(function(error) {
        console.error('Error signing out:', error);
        alert('Error signing out: ' + error.message); // Display error message
    });
}

// Function to increment completed challenges
function incrementCompletedChallenges(userId) {
    var userRef = db.collection('users').doc(userId);

    userRef.get().then((doc) => {
        if (doc.exists) {
            var currentChallenges = doc.data().completedChallenges || 0;
            userRef.update({
                completedChallenges: currentChallenges + 1
            }).then(() => {
                console.log('Completed challenges incremented successfully.');
            }).catch((error) => {
                console.error('Error incrementing completed challenges:', error);
            });
        } else {
            console.log('No such document!');
        }
    }).catch((error) => {
        console.error('Error getting document:', error);
    });
}

// Call this function whenever a game is won
function onGameWin() {
    const user = auth.currentUser;
    if (user) {
        incrementCompletedChallenges(user.uid);
    }
}

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

auth.onAuthStateChanged(function(user) {
    if (user) {
        loadTopDuelists();
        document.getElementById('logout-button').style.display = 'inline';
        
    } else {
        window.location.href = 'login.html';  // Redirect to login page if not signed in
    }
});

function loadTopDuelists() {
    db.collection("users").orderBy("completedChallenges", "desc").limit(10).get()
        .then((querySnapshot) => {
            const tbody = document.getElementById('top-duelists-table').getElementsByTagName('tbody')[0];
            tbody.innerHTML = ''; // Clear the table body
            let rank = 1; // Initialize rank

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rank}</td>
                    <td>${userData.username}</td>
                    <td>${userData.completedChallenges || 0}</td>
                `;
                tbody.appendChild(row);
                rank++; // Increment rank for each user
            });
        })
        .catch((error) => {
            console.error("Error loading top duelists: ", error);
        });
}

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

document.getElementById('logout-button').addEventListener('click', logout);

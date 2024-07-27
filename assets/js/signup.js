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

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        showPopup("Passwords do not match");
        return;
    }

    try {
        // Check if the username is already taken
        const usernameQuery = await db.collection('users').where('username', '==', username).get();
        if (!usernameQuery.empty) {
            showPopup("Username already taken");
            return;
        }

        // Create the user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Add user details to Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            completedChallenges: 0,
            rank: 'newbie',
            joinDate: firebase.firestore.FieldValue.serverTimestamp()
        });

        showPopup("Registration successful", true);
    } catch (error) {
        showPopup(error.message);
    }
});

// Function to show popup
function showPopup(message, redirect = false) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerText = message;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
        if (redirect) {
            window.location.href = 'index.html';
        }
    }, 3000);
}

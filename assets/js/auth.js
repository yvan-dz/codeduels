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

// Show popup function
function showPopup(message) {
    var popup = document.getElementById('popup');
    popup.textContent = message;
    popup.classList.add('show');
    setTimeout(function () {
        popup.classList.remove('show');
    }, 4000); // Adjust the duration as needed
}

// Sign Up function
async function signUp() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirm-password').value;
    var username = document.getElementById('username').value;

    // Regular expression for password validation
    const passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{6,}$/;

    if (!passwordRegex.test(password)) {
        showPopup('Password must be at least 6 characters long, contain at least one uppercase letter, and one digit.');
        return;
    }

    if (password !== confirmPassword) {
        showPopup('Passwords do not match.');
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

        console.log('User added to Firestore');
        window.location.href = 'profile.html'; // Redirect to profile page after sign up
    } catch (error) {
        console.error('Error signing up:', error.message);
        showPopup('Error signing up: ' + error.message); // Display error message
    }
}

// Login function
function login() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            // Signed in
            var user = userCredential.user;
            console.log('User signed in:', user);

            // Get user data from Firestore
            return db.collection('users').doc(user.uid).get();
        })
        .then(function (doc) {
            if (doc.exists) {
                console.log('User data:', doc.data());
                // Do something with user data if needed
            } else {
                console.log('No such document!');
            }
            window.location.href = 'profile.html'; // Redirect to profile page after login
        })
        .catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error('Error signing in:', errorMessage);
            showPopup('Error signing in: ' + errorMessage); // Display error message
        });
}

// Password reset function
function resetPassword() {
    var email = document.getElementById('reset-email').value.trim();

    if (!validateEmail(email)) {
        showPopup('Please enter a valid email address.');
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(function () {
            showPopup('Password reset email sent!');
        })
        .catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error('Error resetting password:', errorMessage);
            showPopup('Error resetting password: ' + errorMessage); // Display error message
        });
}

// Email validation function
function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Attach event listeners to the forms
document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('login-form');
    var signUpForm = document.getElementById('signup-form');
    var resetForm = document.getElementById('reset-form');
    var resetLink = document.getElementById('reset-link');

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            login();
        });
    }

    if (signUpForm) {
        signUpForm.addEventListener('submit', function (event) {
            event.preventDefault();
            signUp();
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', function (event) {
            event.preventDefault();
            resetPassword();
        });
    }

    if (resetLink) {
        resetLink.addEventListener('click', function (event) {
            event.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('reset-form').style.display = 'block';
        });
    }
});

// Logout function
function logout() {
    auth.signOut().then(function () {
        console.log('User signed out');
        window.location.href = 'index.html'; // Redirect to homepage after logout
    }).catch(function (error) {
        console.error('Error signing out:', error);
        showPopup('Error signing out: ' + error.message); // Display error message
    });

}

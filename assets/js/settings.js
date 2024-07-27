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

// Check auth state and populate settings form
auth.onAuthStateChanged(function(user) {
    if (user) {
        var docRef = db.collection("users").doc(user.uid);
        docRef.get().then(function(doc) {
            if (doc.exists) {
                var userData = doc.data();
                document.getElementById('username').value = userData.username;
                document.getElementById('email').value = userData.email;
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

// Update user profile
document.getElementById('settings-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var user = auth.currentUser;
    var username = document.getElementById('username').value;
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    if (user) {
        var updates = {
            username: username,
            email: email
        };

        db.collection('users').doc(user.uid).update(updates).then(function() {
            console.log('User updated in Firestore');
            if (password) {
                user.updatePassword(password).then(function() {
                    console.log('Password updated');
                }).catch(function(error) {
                    console.error('Error updating password:', error);
                    alert('Error updating password: ' + error.message); // Display error message
                });
            }
            alert('Profile updated successfully');
        }).catch(function(error) {
            console.error('Error updating user:', error);
            alert('Error updating user: ' + error.message); // Display error message
        });
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

// Confirm delete account function
function confirmDeleteAccount() {
    document.getElementById('confirm-delete-popup').style.display = 'block';
}

function closeConfirmDeletePopup() {
    document.getElementById('confirm-delete-popup').style.display = 'none';
}

// Delete account function
function deleteAccount() {
    var user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).delete().then(function() {
            return user.delete();
        }).then(function() {
            console.log('User account and Firestore document deleted');
            window.location.href = 'index.html';  // Redirect to homepage after account deletion
        }).catch(function(error) {
            console.error('Error deleting user account:', error);
            alert('Error deleting user account: ' + error.message); // Display error message
        });
    }
}

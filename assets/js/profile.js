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

// Get the currently signed-in user
auth.onAuthStateChanged(function(user) {
  if (user) {
    var docRef = db.collection("users").doc(user.uid);
    docRef.get().then(function(doc) {
      if (doc.exists) {
        var userData = doc.data();
        document.getElementById('username').innerText = userData.username;
        document.getElementById('email').innerText = userData.email;
        // Set other profile data if needed
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

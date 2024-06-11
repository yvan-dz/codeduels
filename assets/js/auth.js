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

// Sign Up function
function signUp() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  var username = document.getElementById('username').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(function(userCredential) {
      // Signed up
      var user = userCredential.user;
      console.log('User signed up:', user);

      // Add user to Firestore
      return db.collection('users').doc(user.uid).set({
        username: username,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add a timestamp
      });
    })
    .then(function() {
      console.log('User added to Firestore');
      window.location.href = 'profile.html';  // Redirect to profile page after sign up
    })
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.error('Error signing up:', errorMessage);
      alert('Error signing up: ' + errorMessage); // Display error message
    });
}

// Login function
function login() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(function(userCredential) {
      // Signed in
      var user = userCredential.user;
      console.log('User signed in:', user);

      // Get user data from Firestore
      return db.collection('users').doc(user.uid).get();
    })
    .then(function(doc) {
      if (doc.exists) {
        console.log('User data:', doc.data());
        // Do something with user data if needed
      } else {
        console.log('No such document!');
      }
      window.location.href = 'profile.html';  // Redirect to profile page after login
    })
    .catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.error('Error signing in:', errorMessage);
      alert('Error signing in: ' + errorMessage); // Display error message
    });
}

// Attach event listeners to the forms
document.addEventListener('DOMContentLoaded', function() {
  var loginForm = document.getElementById('login-form');
  var signUpForm = document.getElementById('signup-form');

  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      login();
    });
  }

  if (signUpForm) {
    signUpForm.addEventListener('submit', function(event) {
      event.preventDefault();
      signUp();
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

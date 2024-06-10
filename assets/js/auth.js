// Firebase Configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Firebase Authentication and Firestore
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Sign Up function
  function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
  
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed up
        var user = userCredential.user;
        console.log('User signed up:', user);
  
        // Add user to Firestore
        return db.collection('users').doc(user.uid).set({
          username: username,
          email: email
        });
      })
      .then(() => {
        console.log('User added to Firestore');
        window.location.href = 'index.html';  // Redirect to homepage after sign up
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error('Error signing up:', errorMessage);
      });
  }
  
  // Login function
  function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        console.log('User signed in:', user);
  
        // Get user data from Firestore
        return db.collection('users').doc(user.uid).get();
      })
      .then((doc) => {
        if (doc.exists) {
          console.log('User data:', doc.data());
          // Do something with user data if needed
        } else {
          console.log('No such document!');
        }
        window.location.href = 'index.html';  // Redirect to homepage after login
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error('Error signing in:', errorMessage);
      });
  }
  
  // Attach event listeners to the forms
  document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    login();
  });
  
  document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    signUp();
  });
  
  // Logout function
  function logout() {
    auth.signOut().then(() => {
      console.log('User signed out');
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }
  
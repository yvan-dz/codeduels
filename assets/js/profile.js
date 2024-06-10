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
  
  // Get the currently signed-in user
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Get user data from Firestore
      db.collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            document.getElementById('username').innerText = doc.data().username;
            document.getElementById('email').innerText = doc.data().email;
            // Add more fields if needed
          } else {
            console.log('No such document!');
          }
        })
        .catch((error) => {
          console.error('Error getting document:', error);
        });
    } else {
      // No user is signed in
      window.location.href = 'login.html';  // Redirect to login page if not signed in
    }
  });
  
  // Logout function
  function logout() {
    auth.signOut().then(() => {
      console.log('User signed out');
      window.location.href = 'index.html';  // Redirect to homepage after logout
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }
  
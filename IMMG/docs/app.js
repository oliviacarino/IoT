const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const thicknessInput = document.getElementById("thickness");

let database;
let firebaseRef;

// Fetch the API key from JSON and initialize Firebase
fetch('firebase-api-key.json')
  .then(response => response.json())
  .then(config => {
    const firebaseConfig = {
      apiKey: config.FIREBASE_API_KEY,
      authDomain: "immg-eb767.firebaseapp.com",
      databaseURL: "https://immg-eb767-default-rtdb.firebaseio.com",
      projectId: "immg-eb767",
      storageBucket: "immg-eb767.appspot.com",
      messagingSenderId: "407794462813",
      appId: "1:407794462813:web:cd56f4aadde9ec4b199db4"
    };
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseRef = database.ref("images");

    // Now that Firebase is ready, set up the auth listener and other Firebase-dependent logic
    setupFirebaseAuthListener();
  })
  .catch(err => {
    console.error("Failed to load Firebase API key:", err);
    showToast("Failed to load Firebase config");
  });

// Move your auth state listener into a function to call after Firebase init
function setupFirebaseAuthListener() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("app-container").style.display = "block";
    } else {
      document.getElementById("login-container").style.display = "block";
      document.getElementById("app-container").style.display = "none";
    }
  });
}

// The rest of your code (login, logout, drawing logic, event listeners, etc.) remains unchanged
// but any Firebase-dependent code (like using firebaseRef) should be used after the fetch completes.

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => showToast("Logged in!"))
    .catch((err) => showToast("Login failed: " + err.message));
}

function logout() {
  firebase.auth().signOut()
    .then(() => showToast("Logged out!"))
    .catch((err) => showToast("Logout error: " + err.message));
}

// ... rest of your existing code unchanged ...
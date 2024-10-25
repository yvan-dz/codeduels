let snippets = [];
let currentSnippetIndex = 0;
let score = 0;
const maxRounds = 5;  // Maximale Anzahl der Aufgaben

// Firebase-Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyAIwf6RVzexCZ0LMfmEFIFBq5YsHm5-lnM",
    authDomain: "codeduels-1b79f.firebaseapp.com",
    projectId: "codeduels-1b79f",
    storageBucket: "codeduels-1b79f",
    messagingSenderId: "927315184082",
    appId: "1:927315184082:web:e115d2bdc6465ffea6a00b",
    measurementId: "G-6Z7PS1DT05"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('signup-button').style.display = 'none';
        document.getElementById('logout-button').style.display = 'block';
        document.getElementById('profile-link').style.display = 'inline';
        document.getElementById('settings-link').style.display = 'inline';
    } else {
        document.getElementById('login-button').style.display = 'inline';
        document.getElementById('signup-button').style.display = 'inline';
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('profile-link').style.display = 'none';
        document.getElementById('settings-link').style.display = 'none';
    }
});

function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out: ', error);
    });
}

// Lade Snippets
async function loadSnippets() {
    try {
        const response = await fetch('assets/js/snippets.json');
        snippets = await response.json();
        showSnippet();
    } catch (error) {
        console.error("Fehler beim Laden der Snippets:", error);
    }
}

function showSnippet() {
    if (currentSnippetIndex < maxRounds) {
        const snippet = snippets[currentSnippetIndex].snippet;
        const codeElement = document.getElementById("code-snippet");

        codeElement.textContent = snippet;

        // Blendet das Snippet nach 5 Sekunden aus
        setTimeout(() => {
            codeElement.textContent = "";
        }, 5000);
    } else {
        showPopup();  // Zeige Popup, wenn die maximale Anzahl von Aufgaben erreicht ist
    }
}

function checkAnswer() {
    const userAnswer = document.getElementById("user-input").value.trim();
    const correctSnippet = snippets[currentSnippetIndex].snippet;
    const feedback = document.getElementById("feedback");

    if (userAnswer === correctSnippet) {
        score++;
        feedback.textContent = "Richtig!";
        feedback.style.color = "green";
    } else {
        feedback.textContent = `Falsch! Richtig wäre: ${correctSnippet}`;
        feedback.style.color = "red";
    }

    document.getElementById("score").textContent = `Score: ${score}`;
    document.getElementById("next-btn").style.display = "inline";
    document.getElementById("submit-btn").disabled = true;
}

function loadNextSnippet() {
    currentSnippetIndex++;
    if (currentSnippetIndex < maxRounds) {
        document.getElementById("user-input").value = "";
        document.getElementById("feedback").textContent = "";
        document.getElementById("next-btn").style.display = "none";
        document.getElementById("submit-btn").disabled = false;
        showSnippet();
    } else {
        showPopup();
    }
}

function showPopup() {
    const popup = document.getElementById("popup");
    document.getElementById("popup-message").textContent = `Game over! Your score: ${score}/${maxRounds}`;
    popup.style.display = "block";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
    currentSnippetIndex = 0;
    score = 0;
    loadSnippets();
}

// Event Listeners
document.getElementById("submit-btn").addEventListener("click", checkAnswer);
document.getElementById("next-btn").addEventListener("click", loadNextSnippet);

document.addEventListener("DOMContentLoaded", loadSnippets);

let currentErrorIndex = 0;
let score = 0;
let selectedErrors = [];
let timerInterval;

// Firebase-Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyAIwf6RVzexCZ0LMfmEFIFBq5YsHm5-lnM",
    authDomain: "codeduels-1b79f.firebaseapp.com",
    projectId: "codeduels-1b79f",
    storageBucket: "codeduels-1b79f.appspot.com",
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

// Funktion zur zufälligen Auswahl von 5 Fehlern
function getRandomErrors(errors) {
    const shuffledErrors = errors.sort(() => Math.random() - 0.5);
    return shuffledErrors.slice(0, 5);
}

async function loadErrors() {
    try {
        const response = await fetch('assets/js/error.json');  // Externe JSON-Datei
        const allErrors = await response.json();
        selectedErrors = getRandomErrors(allErrors);
        displayError();  // Ersten Fehler anzeigen
    } catch (error) {
        console.error('Error loading errors:', error);
    }
}

function displayError() {
    const errorElement = document.getElementById("error-message");
    const userAnswerElement = document.getElementById("user-answer");
    const feedbackElement = document.getElementById("feedback");
    const nextButton = document.getElementById("next-btn");

    feedbackElement.style.display = 'none';  // Feedback zurücksetzen
    userAnswerElement.value = '';  // Antwortfeld zurücksetzen
    nextButton.style.display = 'none';  // "Next"-Button verstecken

    const currentError = selectedErrors[currentErrorIndex];
    errorElement.textContent = currentError.error;
    startTimer();  // Timer starten
}

function checkAnswer() {
    const userAnswer = document.getElementById("user-answer").value.trim();
    const currentError = selectedErrors[currentErrorIndex];

    clearInterval(timerInterval); // Stoppe den Timer, wenn der Benutzer antwortet

    if (userAnswer === currentError.fix) {
        score++;
        document.getElementById("score").textContent = `Score: ${score}`;
        showCorrectAnswer(true); // Zeige Feedback für richtige Antwort
        
    } else {
        showCorrectAnswer(false, currentError.fix); // Zeige Feedback für falsche Antwort und die richtige Lösung
    }
}

function showCorrectAnswer(isCorrect, correctFix = '') {
    const feedbackElement = document.getElementById("feedback");
    const nextButton = document.getElementById("next-btn");

    feedbackElement.style.display = 'block';

    if (isCorrect) {
        feedbackElement.textContent = "Correct!";
        feedbackElement.style.color = '#28a745'; // Grün für richtige Antwort
    } else {
        feedbackElement.textContent = `Incorrect! The correct answer is: ${correctFix}`;
        feedbackElement.style.color = '#dc3545'; // Rot für falsche Antwort
    }

    nextButton.style.display = 'block';  // "Next"-Button anzeigen
}

function loadNextError() {
    currentErrorIndex++;

    if (currentErrorIndex < selectedErrors.length) {
        clearInterval(timerInterval);  // Stelle sicher, dass der Timer zurückgesetzt wird
        displayError(); // Zeige die nächste Frage
    } else {
        // Spiel ist vorbei
        showPopup(); // Zeige das Endergebnis an
    }
}

// Funktion zur Anzeige des Popups nach dem Spiel
function showPopup() {
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    popupMessage.textContent = `Congratulations! You completed the game with a score of ${score}/5.`;
    popup.style.display = 'block';
}

// Funktion zum Schließen des Popups und Neustart des Spiels
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
    resetGame();  // Start a new game
}

function resetGame() {
    currentErrorIndex = 0;
    score = 0;
    document.getElementById("score").textContent = `Score: 0`;
    loadErrors();  // Neue Fehler laden
}

// Timer-Funktion (10 Sekunden)
function startTimer() {
    let timeLeft = 60;
    const timerElement = document.getElementById('timer');

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timerElement.textContent = `Time left: ${timeLeft} seconds`;
            timeLeft--;
        } else {
            clearInterval(timerInterval);
            // Wenn die Zeit abgelaufen ist, wird die Antwort als falsch betrachtet
            showCorrectAnswer(false, selectedErrors[currentErrorIndex].fix);
        }
    }, 1000);
}

// Event Listener für den "Next"-Button und den "Senden"-Button
document.getElementById('submit-btn').addEventListener('click', checkAnswer);
document.getElementById('next-btn').addEventListener('click', loadNextError);

// Beim Laden der Seite das Spiel starten
document.addEventListener("DOMContentLoaded", loadErrors);

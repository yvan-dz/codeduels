let currentQuestionIndex = 0;
let score = 0;
let selectedQuestions = [];
let timerInterval;  // Variable pour stocker l'intervalle du timer

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

// Fonction pour démarrer le timer
function startTimer() {
    let timeLeft = 10;  // 10 seconds for each question
    const timerElement = document.getElementById("timer");
    
    timerElement.textContent = `Time left: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time left: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);  // Stop the timer
            handleTimeOut();  // Handle timeout if no answer is selected
        }
    }, 1000);
}

// Fonction appelée lorsque le timer expire
function handleTimeOut() {
    checkAnswer(-1);  // Consider it as a wrong answer (index -1 means no answer)
}

// Fonction pour arrêter le timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Fonction pour choisir aléatoirement 5 questions
function getRandomQuestions(questions) {
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    return shuffledQuestions.slice(0, 5);
}

async function loadQuestions() {
    try {
        const response = await fetch('assets/js/questions.json');  // Externe JSON-Datei
        const allQuestions = await response.json();
        selectedQuestions = getRandomQuestions(allQuestions);
        displayQuestion();  // Afficher la première question
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function displayQuestion() {
    const questionElement = document.getElementById("question");
    const answersElement = document.getElementById("answers");
    const nextButton = document.getElementById("next-btn");

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;

    // Réinitialiser les réponses
    answersElement.innerHTML = '';

    // Afficher les réponses
    currentQuestion.answers.forEach((answer, index) => {
        const button = document.createElement("button");
        button.textContent = answer;
        button.onclick = () => checkAnswer(index, button);
        answersElement.appendChild(button);
    });

    nextButton.style.display = 'none';  // Masquer le bouton de question suivante

    startTimer();  // Lancer le timer pour cette question
}

function checkAnswer(selectedIndex, selectedButton = null) {
    stopTimer();  // Arrêter le timer car une réponse a été donnée ou le temps est écoulé

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const correctAnswer = currentQuestion.correctAnswer;

    // Marquer les réponses avec des couleurs
    document.querySelectorAll('#answers button').forEach((button, index) => {
        if (index === correctAnswer) {
            button.style.backgroundColor = '#28a745';  // Vert pour la bonne réponse
        } else if (index === selectedIndex) {
            button.style.backgroundColor = '#dc3545';  // Rouge pour la mauvaise réponse
        }
        button.disabled = true;  // Désactiver tous les boutons
    });

    // Si le joueur a répondu correctement
    if (selectedIndex === correctAnswer) {
        score++;
        document.getElementById("score").textContent = `Score: ${score}`;
    }

    // Afficher le bouton pour la question suivante
    document.getElementById("next-btn").style.display = 'block';
}

function loadNextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < selectedQuestions.length) {
        displayQuestion();
    } else {
        // Quiz terminé
        showPopup();
    }
}

// Réinitialiser le quiz
function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById("score").textContent = `Score: 0`;
    loadQuestions();  // Charger de nouvelles questions
}

// Fonction pour afficher le popup après la fin du quiz
function showPopup() {
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    popupMessage.textContent = `Congratulations! You completed the quiz with a score of ${score}/5.`;
    popup.style.display = 'block';
}

// Fonction pour fermer le popup et redémarrer le jeu
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
    resetQuiz();  // Démarrer un nouveau jeu
}

// Charger les questions au démarrage de la page
document.addEventListener("DOMContentLoaded", loadQuestions);

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Firestore
    const db = firebase.firestore();
    let friendId = null;  // Define friendId at the beginning

    // Timer duration in seconds
    const TIMER_DURATION = 20; // 5 minutes

    // Funktion zum Bestimmen des friendId basierend auf der gleichen gameId
    function getFriendIdByGameId(userId, gameId) {
        return db.collection('users')
            .where('gameId', '==', gameId)  // Suche nach allen Benutzern mit der gleichen gameId
            .get()
            .then((snapshot) => {
                let foundFriendId = null;
                snapshot.forEach((doc) => {
                    if (doc.id !== userId) {  // Stelle sicher, dass wir nicht den aktuellen Benutzer als Freund nehmen
                        foundFriendId = doc.id;
                    }
                });
                return foundFriendId;
            });
    }

    // Create a container to display the players' names
    function createPlayersContainer() {
        const playersContainer = document.createElement('div');
        playersContainer.id = 'players-container';
        playersContainer.innerHTML = `
            <h3>Players:</h3>
            <p id="player1-name">Player 1: </p>
            <p id="player2-name">Player 2: </p>
        `;
        document.body.appendChild(playersContainer);
    }

    // Update players' names in the container
    function updatePlayersContainer(player1Name, player2Name) {
        document.getElementById('player1-name').textContent = `Player 1: ${player1Name}`;
        document.getElementById('player2-name').textContent = `Player 2: ${player2Name}`;
    }

    // Reset result container
    function resetResultContainer() {
        const resultContainer = document.getElementById('result-container');
        resultContainer.innerHTML = 'Waiting for players\' results...'; // Clear the result container
    }

    // Reset chat messages
    function resetChat() {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = ''; // Clear the chat box

        // Optionally delete chat messages from Firestore if needed
        db.collection('chats').get().then((snapshot) => {
            snapshot.forEach((doc) => {
                db.collection('chats').doc(doc.id).delete();
            });
        });
    }

    // Delete previous game results from Firestore
    function deletePreviousResults(userId, friendId) {
        db.collection('games')
            .where('userId', 'in', [userId, friendId])
            .get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    db.collection('games').doc(doc.id).delete();
                });
            });
    }

    // Function to increment completed challenges
    function incrementCompletedChallenges(userId) {
        const userRef = db.collection('users').doc(userId);
        userRef.get().then((doc) => {
            if (doc.exists) {
                const currentChallenges = doc.data().completedChallenges || 0;
                userRef.update({
                    completedChallenges: currentChallenges + 1
                }).then(() => {
                    console.log('Completed challenges incremented successfully.');
                }).catch((error) => {
                    console.error('Error incrementing completed challenges:', error);
                });
            } else {
                console.log('No such document!');
            }
        }).catch((error) => {
            console.error('Error getting document:', error);
        });
    }

    // Function to reset both editors and their content in Firebase
    function resetEditors(userId, friendId) {
        const editor1Container = document.getElementById('editor1');
        const editor2Container = document.getElementById('editor2');
        editor1Container.innerHTML = ''; // Clear editor1 container
        editor2Container.innerHTML = ''; // Clear editor2 container

        // Delete editor content from Firestore
        db.collection('code-editors').doc(userId).delete();
        db.collection('code-editors').doc(friendId).delete();
    }

    // Function to load the same exercise for both friends using gameId
    async function loadExerciseForFriends(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();

            if (!userData) {
                throw new Error("User data not found.");
            }

            // Verwende die gameId, um den friendId zu ermitteln
            const gameId = userData.gameId;  // Erhalte die gameId des Benutzers
            let friendId = null;

            if (gameId) {
                // Ermittele den friendId basierend auf der gameId
                const friendSnapshot = await db.collection('users')
                    .where('gameId', '==', gameId)
                    .get();

                friendSnapshot.forEach((doc) => {
                    if (doc.id !== userId) {
                        friendId = doc.id;
                    }
                });

                if (!friendId) {
                    throw new Error("No friend found with the same gameId.");
                }
            } else {
                throw new Error("gameId not found for user.");
            }

            const taskDoc = await db.collection('tasks').doc(userId).get();

            const exercisesResponse = await fetch('assets/js/java_exercises.json');
            const exercises = await exercisesResponse.json();

            const userTaskIndexDoc = await db.collection('taskIndexes').doc(userId).get();
            let taskIndex = 0;

            if (userTaskIndexDoc.exists) {
                taskIndex = userTaskIndexDoc.data().index;
            }

            const nextTaskIndex = (taskIndex + 1) % exercises.length;
            const nextTask = exercises[nextTaskIndex];

            // Setze die Aufgabe für beide Spieler
            await db.collection('tasks').doc(userId).set(nextTask);
            await db.collection('tasks').doc(friendId).set(nextTask);
            await db.collection('taskIndexes').doc(userId).set({ index: nextTaskIndex });
            await db.collection('taskIndexes').doc(friendId).set({ index: nextTaskIndex });

            displayTask(nextTask);

            // Clear chat, reset editors, initialize editors, and reset result container when a new game is loaded
            resetChat();
            resetEditors(userId, friendId);
            initializeEditors(nextTask.code_template);
            resetResultContainer();
            deletePreviousResults(userId, friendId);
            document.getElementById('run-btn').style.display = 'block';

            // Update players' names
            const friendDoc = await db.collection('users').doc(friendId).get();
            if (friendDoc.exists && userData) {
                const friendData = friendDoc.data();
                if (!friendData) {
                    throw new Error("Friend data not found.");
                }
                updatePlayersContainer(userData.username, friendData.username);
            } else {
                console.error("Error: Unable to retrieve user or friend data.");
            }

            // Start the timer
            startTimer(userId, friendId, TIMER_DURATION);
        } catch (error) {
            console.error("Error loading exercise:", error);
        }
    }

    function displayTask(task) {
        const taskContainer = document.getElementById('task-container');
        taskContainer.innerHTML = `
            <h1>Task: ${task.title}</h1>
            <p>${task.description}</p>
            <h3>Examples:</h3>
            <ul>
                ${task.examples.map(example => `<li>${example}</li>`).join('')}
            </ul>
            <div id="timer">Time left: ${TIMER_DURATION} seconds</div>
        `;
        window.expectedOutput = task.expected_output;
        window.codeTemplate = task.code_template;
    }

    function initializeEditors(codeTemplate) {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            var editor1 = monaco.editor.create(document.getElementById('editor1'), {
                value: codeTemplate,
                language: 'java',
                theme: 'vs-dark',
                automaticLayout: true
            });

            var editor2 = monaco.editor.create(document.getElementById('editor2'), {
                value: codeTemplate,
                language: 'java',
                theme: 'vs-dark',
                automaticLayout: true,
                readOnly: true
            });

            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    const userId = user.uid;

                    // Ermittele friendId basierend auf der gameId
                    db.collection('users').doc(userId).get().then((userDoc) => {
                        const userData = userDoc.data();
                        const gameId = userData.gameId; // Verwende die gameId des Benutzers

                        if (gameId) {
                            db.collection('users')
                                .where('gameId', '==', gameId)
                                .get()
                                .then((snapshot) => {
                                    let friendId = null;
                                    snapshot.forEach((doc) => {
                                        if (doc.id !== userId) {  // Stelle sicher, dass wir nicht den aktuellen Benutzer als Freund nehmen
                                            friendId = doc.id;
                                        }
                                    });

                                    if (friendId) {
                                        // Save editor1 content to Firestore
                                        editor1.onDidChangeModelContent(() => {
                                            const code = editor1.getValue();
                                            db.collection('code-editors').doc(userId).set({ code });
                                        });

                                        // Listen for changes in Firestore and update editor2
                                        db.collection('code-editors').doc(friendId).onSnapshot((doc) => {
                                            const data = doc.data();
                                            if (data && data.code) {
                                                editor2.setValue(data.code);
                                            }
                                        });

                                        // Check if friend is online
                                        db.collection('online-users').doc(friendId).onSnapshot((friendDoc) => {
                                            if (friendDoc.exists) {
                                                hideWaitingPopup();
                                            } else {
                                                showWaitingPopup();
                                            }
                                        });

                                        // Real-time chat functionality
                                        const chatInput = document.getElementById('chat-input');
                                        const chatBox = document.getElementById('chat-box');
                                        const sendBtn = document.getElementById('send-btn');
                                        const runBtn = document.getElementById('run-btn');
                                        const outputElement = document.getElementById('output');
                                        const resultContainer = document.getElementById('result-container');

                                        sendBtn.addEventListener('click', async function () {
                                            const message = chatInput.value;
                                            if (message.trim()) {
                                                const userDoc = await db.collection('users').doc(userId).get();
                                                const username = userDoc.data().username;
                                                db.collection('chats').add({
                                                    from: userId,
                                                    username: username, // Add username to the message data
                                                    message: message,
                                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                });
                                                chatInput.value = '';
                                            }
                                        });

                                        // Listen for chat messages
                                        db.collection('chats').orderBy('timestamp').onSnapshot((snapshot) => {
                                            chatBox.innerHTML = '';
                                            snapshot.forEach((doc) => {
                                                const chatData = doc.data();
                                                const messageElement = document.createElement('div');
                                                messageElement.textContent = `${chatData.username}: ${chatData.message}`; // Show username before the message
                                                chatBox.appendChild(messageElement);
                                            });
                                            chatBox.scrollTop = chatBox.scrollHeight;
                                        });

                                        runBtn.addEventListener('click', async function () {
                                            const code = editor1.getValue();
                                            console.log('Player Code:', code);

                                            try {
                                                const response = await fetch('/api/execute', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({ code: code, language: 'java' })
                                                });
                                                const result = await response.json();

                                                const won = result.output.trim() === window.expectedOutput;
                                                const resultMessage = won ? 'You won! Your opponent lost!' : 'You lost! Your opponent won!';

                                                // Save the result to Firestore
                                                const gameRef = db.collection('games').doc();
                                                const gameId = gameRef.id;

                                                await gameRef.set({
                                                    userId: userId,
                                                    friendId: friendId,
                                                    output: result.output,
                                                    result: won ? 'won' : 'lost',
                                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                });

                                                if (won) {
                                                    incrementCompletedChallenges(userId); // Increment completed challenges for the winner
                                                } else {
                                                    incrementCompletedChallenges(friendId); // Increment completed challenges for the friend if user loses
                                                }

                                                updateResultContainer(userId, friendId, won, result.output, result.executionTime);
                                                runBtn.style.display = 'none';

                                                // Hide the run button for both players
                                                db.collection('games').doc(gameId).set({ runButtonHidden: true }, { merge: true });

                                            } catch (error) {
                                                console.error('Error executing code:', error);
                                                outputElement.textContent = `Error: ${error.message}`;
                                            }
                                        });

                                        // Listen for game results in real-time
                                        db.collection('games')
                                            .where('userId', 'in', [userId, friendId])
                                            .orderBy('timestamp', 'desc')
                                            .limit(1)
                                            .onSnapshot((snapshot) => {
                                                snapshot.forEach((doc) => {
                                                    const gameData = doc.data();
                                                    const userDoc = db.collection('users').doc(gameData.userId).get();
                                                    const friendDoc = db.collection('users').doc(gameData.friendId).get();
                                                    Promise.all([userDoc, friendDoc]).then((docs) => {
                                                        const user = docs[0].data();
                                                        const friend = docs[1].data();
                                                        const winner = gameData.result === 'won' ? user.username : friend.username;
                                                        const loser = gameData.result === 'lost' ? user.username : friend.username;
                                                        resultContainer.innerHTML = `
                                                            <h3>Game Result:</h3>
                                                            <p>Winner: ${winner}</p>
                                                            <p>Loser: ${loser}</p>
                                                            <p>Output: ${gameData.output}</p>
                                                        `;
                                                        removeGameId(userId);
                                                        removeGameId(friendId);
                                                    });

                                                    if (gameData.runButtonHidden) {
                                                        document.getElementById('run-btn').style.display = 'none';
                                                    }
                                                });
                                            });
                                    } else {
                                        console.error("No friend found with the same gameId.");
                                    }
                                });
                        } else {
                            console.error("No gameId found for the user.");
                        }
                    });
                }
            });
        });
    }


    // Timer function
    function startTimer(userId, friendId, duration) {
        let timer = duration, minutes, seconds;
        const timerElement = document.getElementById('timer');

        const interval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;

            timerElement.textContent = `Time left: ${minutes}:${seconds}`;

            if (--timer < 0) {
                clearInterval(interval);
                markPlayersAsLosers(userId, friendId);
            }
        }, 1000);
    }

    // Mark both players as losers
    function markPlayersAsLosers(userId, friendId) {
        const gameRef = db.collection('games').doc();

        gameRef.set({
            userId: userId,
            friendId: friendId,
            result: 'both_lost',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById('run-btn').style.display = 'none';
            const resultContainer = document.getElementById('result-container');
            resultContainer.style.display = 'none'; // Hide the result container
            removeGameId(userId);
            removeGameId(friendId);
            showPopup(); // Show the popup
        }).catch((error) => {
            console.error('Error marking players as losers:', error);
        });
    }

    // Show the popup
    function showPopup() {
        const popup = document.getElementById('popup');
        popup.style.display = 'block';

        // Close the popup when the close button is clicked
        document.getElementById('close-popup').addEventListener('click', () => {
            popup.style.display = 'none';
        });
    }

    // Function to reset both users at the end of the game
    function resetUsers(userId, friendId) {
        resetChat();
        resetEditors(userId, friendId);
        resetResultContainer();
        deletePreviousResults(userId, friendId);
        // Additional actions if needed
    }

    // End any ongoing games at the start
    function endOngoingGames(userId) {
        db.collection('games')
            .where('userId', '==', userId)
            .where('result', '==', 'ongoing')
            .get()
            .then((snapshot) => {
                const batch = db.batch();
                snapshot.forEach((doc) => {
                    batch.update(doc.ref, { result: 'aborted' });
                });
                return batch.commit();
            })
            .then(() => {
                console.log('All ongoing games have been ended.');
            })
            .catch((error) => {
                console.error('Error ending ongoing games:', error);
            });
    }

    // Load the exercise for the user
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            endOngoingGames(userId); // End any ongoing games for the user
            db.collection('users').doc(userId).get().then((userDoc) => {
                const userData = userDoc.data();
                if (userData.friends && userData.friends.length > 0) {
                    const friendId = userData.currentOpponent || userData.friends[0];
                    resetResultContainer();
                    deletePreviousResults(userId, friendId);
                    loadExerciseForFriends(userId);
                    resetEditors(userId, friendId);
                }
            });
        }
    });

    // Handle confirmation before leaving or reloading the page
    window.addEventListener('beforeunload', function (e) {
        const confirmationMessage = 'Are you sure you want to leave? Your changes might not be saved.';
        e.returnValue = confirmationMessage; // Standard for most browsers
        return confirmationMessage; // For older browsers
    });

    createPlayersContainer(); // Create the players container on page load

    // Function to remove the gameId at the end of the game
    function removeGameId(userId) {
        db.collection('users').doc(userId).update({
            gameId: firebase.firestore.FieldValue.delete() // Lösche das Feld gameId
        })
            .then(() => {
                console.log(`gameId for user ${userId} successfully deleted.`);
            })
            .catch((error) => {
                console.error("Error removing gameId: ", error);
            });
    }

});

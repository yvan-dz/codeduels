document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Firestore
    const db = firebase.firestore();

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

    // Function to load the same exercise for both friends
    async function loadExerciseForFriends(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();

            if (userData.friends && userData.friends.length > 0) {
                const friendId = userData.friends[0]; // Assume only one friend for simplicity
                const taskDoc = await db.collection('tasks').doc(userId).get();

                const exercisesResponse = await fetch('assets/js/python_exercises.json');
                const exercises = await exercisesResponse.json();

                const userTaskIndexDoc = await db.collection('taskIndexes').doc(userId).get();
                let taskIndex = 0;

                if (userTaskIndexDoc.exists) {
                    taskIndex = userTaskIndexDoc.data().index;
                }

                const nextTaskIndex = (taskIndex + 1) % exercises.length;
                const nextTask = exercises[nextTaskIndex];

                await db.collection('tasks').doc(userId).set(nextTask);
                await db.collection('tasks').doc(friendId).set(nextTask);
                await db.collection('taskIndexes').doc(userId).set({ index: nextTaskIndex });
                await db.collection('taskIndexes').doc(friendId).set({ index: nextTaskIndex });

                displayTask(nextTask);

                // Clear chat, initialize editors, and reset result container when a new game is loaded
                resetChat();
                initializeEditors(nextTask.code_template);
                resetResultContainer();
                deletePreviousResults(userId, friendId);
                document.getElementById('run-btn').style.display = 'block';
            }
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
        `;
        window.expectedOutput = task.expected_output;
        window.codeTemplate = task.code_template;
    }

    function initializeEditors(codeTemplate) {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            var editor1 = monaco.editor.create(document.getElementById('editor1'), {
                value: codeTemplate,
                language: 'python',
                theme: 'vs-dark',
                automaticLayout: true
            });

            var editor2 = monaco.editor.create(document.getElementById('editor2'), {
                value: '# this is player 2\'s code\n# you cannot edit this',
                language: 'python',
                theme: 'vs-dark',
                automaticLayout: true,
                readOnly: true
            });

            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    const userId = user.uid;

                    // Save editor1 content to Firestore
                    editor1.onDidChangeModelContent(() => {
                        const code = editor1.getValue();
                        db.collection('code-editors').doc(userId).set({ code });
                    });

                    // Listen for changes in Firestore and update editor2
                    db.collection('users').doc(userId).get().then((userDoc) => {
                        const userData = userDoc.data();
                        if (userData.friends && userData.friends.length > 0) {
                            const friendId = userData.friends[0];
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

                            sendBtn.addEventListener('click', function () {
                                const message = chatInput.value;
                                if (message.trim()) {
                                    db.collection('chats').add({
                                        from: userId,
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
                                    messageElement.textContent = chatData.message;
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
                                        body: JSON.stringify({ code: code, language: 'python' })
                                    });
                                    const result = await response.json();

                                    const won = result.output.trim() === window.expectedOutput;
                                    const resultMessage = won ? 'You won! Your opponent lost!' : 'You lost! Your opponent won!';

                                    // Save the result to Firestore
                                    const gameRef = db.collection('games').doc();
                                    gameId = gameRef.id;

                                    await gameRef.set({
                                        userId: userId,
                                        friendId: friendId,
                                        output: result.output,
                                        result: won ? 'won' : 'lost',
                                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                    });

                                    if (won) {
                                        incrementCompletedChallenges(userId); // Increment completed challenges for the winner
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
                                        });

                                        if (gameData.runButtonHidden) {
                                            document.getElementById('run-btn').style.display = 'none';
                                        }
                                    });
                                });

                                function updateResultContainer(player1, player2, won, output, executionTime) {
                                    if (won) {
                                        resultContainer.innerHTML = `
                                                                                        <h3>Player Output:</h3>
                                            <pre>${output}</pre>
                                            <p>Winner: Player 1</p>
                                            <p>Loser: Player 2</p>
                                            <p>Execution Time: ${executionTime} ms</p>
                                        `;
                                    } else {
                                        resultContainer.innerHTML = `
                                            <h3>Player Output:</h3>
                                            <pre>${output}</pre>
                                            <p>Winner: Player 2</p>
                                            <p>Loser: Player 1</p>
                                            <p>Example Solution: ${window.expectedOutput}</p>
                                        `;
                                    }
                                }

                                function checkOpponentStatus(userId) {
                                    const userDocRef = db.collection('online-users').doc(userId);
                                    userDocRef.onSnapshot((doc) => {
                                        if (doc.exists) {
                                            const userData = doc.data();
                                            if (userData && userData.friends && userData.friends.length > 0) {
                                                const friendId = userData.friends[0]; // Assume only one friend for simplicity

                                                const friendDocRef = db.collection('online-users').doc(friendId);
                                                friendDocRef.onSnapshot((friendDoc) => {
                                                    if (friendDoc.exists) {
                                                        hideWaitingPopup();
                                                    } else {
                                                        showWaitingPopup();
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }

                                checkOpponentStatus(userId);

                                window.addEventListener('beforeunload', function (e) {
                                    // Notify opponent if user leaves the page
                                    db.collection('online-users').doc(userId).delete().then(() => {
                                        db.collection('users').doc(userId).get().then((userDoc) => {
                                            const userData = userDoc.data();
                                            if (userData.friends && userData.friends.length > 0) {
                                                const friendId = userData.friends[0]; // Assume only one friend for simplicity
                                                db.collection('notifications').add({
                                                    to: friendId,
                                                    message: 'You won! Your friend left the game!',
                                                    type: 'success',
                                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                });

                                                db.collection('games').add({
                                                    userId: friendId,
                                                    result: 'won',
                                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                });

                                                db.collection('notifications').add({
                                                    to: userId,
                                                    message: 'You lost! You left the game!',
                                                    type: 'error',
                                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                });

                                                db.collection('games').add({
                                                    userId: userId,
                                                    result: 'lost',
                                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                                });

                                                const resultContainer = document.getElementById('result-container');
                                                resultContainer.innerHTML = `
                                                    <h3>Player left the game!</h3>
                                                    <p>Winner: Opponent</p>
                                                    <p>Loser: Player</p>
                                                `;
                                                runBtn.style.display = 'none';
                                            }
                                        });
                                    });
                                });

                                window.addEventListener('load', function () {
                                    // Add user to online-users collection
                                    db.collection('online-users').doc(userId).set({
                                        online: true,
                                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                    });
                                });
                            }
                        });
                    }
                });
            });
        }
    
        // Load the exercise for the user
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                const userId = user.uid;
                db.collection('users').doc(userId).get().then((userDoc) => {
                    const userData = userDoc.data();
                    if (userData.friends && userData.friends.length > 0) {
                        const friendId = userData.friends[0];
                        resetResultContainer();
                        deletePreviousResults(userId, friendId);
                        loadExerciseForFriends(userId);
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
    });

    // Function to increment completed challenges
    function incrementCompletedChallenges(userId) {
        var userRef = db.collection('users').doc(userId);
    
        userRef.get().then((doc) => {
            if (doc.exists) {
                var currentChallenges = doc.data().completedChallenges || 0;
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


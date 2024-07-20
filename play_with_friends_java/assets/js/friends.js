document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Firestore
    const db = firebase.firestore();
    let player1Result = null;
    let player2Result = null;
    let gameId = null;

    // Function to load the same exercise for both friends
    function loadExerciseForFriends(userId) {
        db.collection('users').doc(userId).get().then((userDoc) => {
            const userData = userDoc.data();
            if (userData.friends && userData.friends.length > 0) {
                const friendId = userData.friends[0]; // Assume only one friend for simplicity

                db.collection('tasks').doc(userId).get().then((taskDoc) => {
                    if (taskDoc.exists) {
                        const taskData = taskDoc.data();
                        displayTask(taskData);
                    } else {
                        fetch('assets/js/java_exercises.json')
                            .then(response => response.json())
                            .then(exercises => {
                                const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
                                db.collection('tasks').doc(userId).set(randomExercise);
                                db.collection('tasks').doc(friendId).set(randomExercise);
                                displayTask(randomExercise);
                            });
                    }
                });
            }
        });
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
        initializeEditors(task.code_template);
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
                value: '// this is player 2\'s code\n// you cannot edit this',
                language: 'java',
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
                                console.log('Player 1 Code:', code);

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
                                    const resultType = won ? 'success' : 'error';
                                    
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
                                        player1Result = result.output;
                                    } else {
                                        player2Result = result.output;
                                    }

                                    updateResultContainer(userId, friendId, won, result.output, result.executionTime);
                                    runBtn.style.display = 'none';

                                } catch (error) {
                                    console.error('Error executing code:', error);
                                    outputElement.textContent = `Error: ${error.message}`;
                                }
                            });

                            function updateResultContainer(player1, player2, won, output, executionTime) {
                                if (won) {
                                    resultContainer.innerHTML = `
                                        <h3>Player 1 Output:</h3>
                                        <pre>${output}</pre>
                                        <p>Winner: Player 1</p>
                                        <p>Loser: Player 2</p>
                                        <p>Execution Time: ${executionTime} ms</p>
                                    `;
                                } else {
                                    resultContainer.innerHTML = `
                                        <h3>Player 1 Output:</h3>
                                        <pre>${output}</pre>
                                        <p>Winner: Player 2</p>
                                        <p>Loser: Player 1</p>
                                        <p>Example Solution: ${window.expectedOutput}</p>
                                    `;
                                }
                            }

                            function showWaitingPopup() {
                                const popup = document.createElement('div');
                                popup.classList.add('popup', 'waiting');
                                popup.innerHTML = `
                                    <div class="popup-content">
                                        <p>Waiting for your opponent...</p>
                                    </div>
                                `;
                                document.body.appendChild(popup);
                                document.body.classList.add('no-scroll'); // Prevent scrolling
                            }

                            function hideWaitingPopup() {
                                const popup = document.querySelector('.popup.waiting');
                                if (popup) {
                                    document.body.removeChild(popup);
                                }
                                document.body.classList.remove('no-scroll'); // Allow scrolling
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
                                                <h3>Player 1 left the game!</h3>
                                                <p>Winner: Player 2</p>
                                                <p>Loser: Player 1</p>
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
            loadExerciseForFriends(user.uid);
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Firestore
    const db = firebase.firestore();

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
                            userData.friends.forEach((friendId) => {
                                db.collection('code-editors').doc(friendId).onSnapshot((doc) => {
                                    const data = doc.data();
                                    if (data && data.code) {
                                        editor2.setValue(data.code);
                                    }
                                });
                            });
                        }
                    });

                    // Real-time chat functionality
                    const chatInput = document.getElementById('chat-input');
                    const chatBox = document.getElementById('chat-box');
                    const sendBtn = document.getElementById('send-btn');
                    const runBtn = document.getElementById('run-btn');
                    const outputElement = document.getElementById('output');

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
                        const code1 = editor1.getValue();
                        console.log('Player 1 Code:', code1);

                        try {
                            const response1 = await fetch('/api/execute', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ code: code1, language: 'java' })
                            });
                            const result1 = await response1.json();

                            outputElement.innerHTML = `
                                <h3>Player 1 Output:</h3>
                                <pre>${result1.output}</pre>
                            `;

                            const won = result1.output.trim() === window.expectedOutput;
                            const message = won ? 'You won! Your opponent lost!' : 'You lost! Your opponent won!';
                            const type = won ? 'success' : 'error';

                            db.collection('games').add({
                                userId: user.uid,
                                result: won ? 'won' : 'lost',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });

                            notifyFriend(user.uid, won, message, type);
                            showPopup(message, type, userId, friendId);

                        } catch (error) {
                            console.error('Error executing code:', error);
                            outputElement.textContent = `Error: ${error.message}`;
                        }
                    });

                    function showPopup(message, type, userId, friendId) {
                        const popup = document.createElement('div');
                        popup.classList.add('popup', type);
                        popup.innerHTML = `
                            <div class="popup-content">
                                <p>${message}</p>
                                <p id="timer">5</p>
                            </div>
                        `;
                        document.body.appendChild(popup);

                        let countdown = 5;
                        const timerElement = document.getElementById('timer');
                        const interval = setInterval(() => {
                            countdown -= 1;
                            timerElement.textContent = countdown;
                            if (countdown === 0) {
                                clearInterval(interval);
                                window.location.href = '../index.html'; // Redirect to homepage
                            }
                        }, 1000);

                        // Update friend's notification
                        db.collection('notifications').add({
                            to: friendId,
                            message: message,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    function notifyFriend(userId, won, message, type) {
                        db.collection('users').doc(userId).get().then((userDoc) => {
                            const userData = userDoc.data();
                            if (userData.friends && userData.friends.length > 0) {
                                const friendId = userData.friends[0];
                                db.collection('games').add({
                                    userId: friendId,
                                    result: won ? 'lost' : 'won',
                                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                });

                                // Real-time notification for the friend
                                db.collection('notifications').where('to', '==', friendId).onSnapshot((snapshot) => {
                                    snapshot.forEach((doc) => {
                                        const data = doc.data();
                                        if (data.message === message) {
                                            showPopup(data.message, type, friendId, userId);
                                        }
                                    });
                                });
                            }
                        });
                    }

                    function showWaitingPopup() {
                        const popup = document.createElement('div');
                        popup.classList.add('popup', 'waiting');
                        popup.innerHTML = `
                            <div class="popup-content">
                                <p>Waiting for your friend to join...</p>
                            </div>
                        `;
                        document.body.appendChild(popup);
                    }

                    function removeWaitingPopup() {
                        const popup = document.querySelector('.popup.waiting');
                        if (popup) {
                            document.body.removeChild(popup);
                        }
                    }

                    // Check if friend is online
                    db.collection('users').doc(userId).get().then((userDoc) => {
                        const userData = userDoc.data();
                        if (userData.friends && userData.friends.length > 0) {
                            const friendId = userData.friends[0];
                            db.collection('users').doc(friendId).onSnapshot((doc) => {
                                if (doc.exists && doc.data().online) {
                                    removeWaitingPopup();
                                } else {
                                    showWaitingPopup();
                                }
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

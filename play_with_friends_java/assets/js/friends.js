document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase Firestore
    const db = firebase.firestore();

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
                                    const result = won ? 'won' : 'lost';

                                    // Update game result
                                    db.collection('games').add({
                                        userId: user.uid,
                                        friendId: friendId, // friendId
                                        result: result,
                                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                    });

                                } catch (error) {
                                    console.error('Error executing code:', error);
                                    outputElement.textContent = `Error: ${error.message}`;
                                }
                            });

                            // Listen for notifications in real-time
                            db.collection('notifications')
                                .where('to', '==', userId)
                                .orderBy('timestamp', 'desc')
                                .limit(1)
                                .onSnapshot((snapshot) => {
                                    snapshot.forEach((doc) => {
                                        const notification = doc.data();
                                        showPopup(notification.message, 'info'); // Display the notification
                                    });
                                });

                            function showPopup(message, type) {
                                const popup = document.createElement('div');
                                popup.classList.add('popup', type);
                                popup.innerHTML = `
                                    <div class="popup-content">
                                        <p>${message}</p>
                                        <button onclick="closePopup()">Close</button>
                                    </div>
                                `;
                                document.body.appendChild(popup);

                                setTimeout(() => {
                                    closePopup();
                                }, 10000); // Close the notification after 10 seconds
                            }

                            window.closePopup = function () {
                                const popup = document.querySelector('.popup');
                                if (popup) {
                                    document.body.removeChild(popup);
                                }
                            };

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
                                        if (userData.friends && userData.friends.length > 0) {
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
                                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                            });

                                            db.collection('games').add({
                                                userId: userId,
                                                result: 'lost',
                                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                            });

                                            showPopup('You lost! You left the game!', 'error');
                                            notifyFriend(userId, false, 'You won! Your friend left the game!', 'success');
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

                                           

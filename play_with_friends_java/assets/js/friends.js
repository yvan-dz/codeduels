document.addEventListener('DOMContentLoaded', function () {
    // Load Java exercises
    fetch('assets/js/java_exercises.json')
        .then(response => response.json())
        .then(exercises => {
            // Select a random exercise
            const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
            // Display the exercise
            const taskContainer = document.getElementById('task-container');
            taskContainer.innerHTML = `
                <h1>Task: ${randomExercise.title}</h1>
                <p>${randomExercise.description}</p>
                <h3>Examples:</h3>
                <ul>
                    ${randomExercise.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
            `;
        });

    // Initialize Monaco Editor
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        var editor1 = monaco.editor.create(document.getElementById('editor1'), {
            value: '// your code here',
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

        const chatInput = document.getElementById('chat-input');
        const chatBox = document.getElementById('chat-box');
        const sendBtn = document.getElementById('send-btn');
        const runBtn = document.getElementById('run-btn');
        const outputElement = document.getElementById('output');

        sendBtn.addEventListener('click', function () {
            const message = chatInput.value;
            if (message.trim()) {
                const messageElement = document.createElement('div');
                messageElement.textContent = message;
                chatBox.appendChild(messageElement);
                chatInput.value = '';
                chatBox.scrollTop = chatBox.scrollHeight;
            }
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
            } catch (error) {
                console.error('Error executing code:', error);
                outputElement.textContent = `Error: ${error.message}`;
            }
        });
    });
});

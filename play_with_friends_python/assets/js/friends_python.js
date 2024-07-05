document.addEventListener('DOMContentLoaded', function () {
    // Load JavaScript exercises
    fetch('assets/js/javascript_exercises.json')
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

    var editor1 = CodeMirror.fromTextArea(document.getElementById('editor1'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'material-darker'
    });

    var editor2 = CodeMirror.fromTextArea(document.getElementById('editor2'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'material-darker'
    });

    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const runBtn = document.getElementById('run-btn');

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

    runBtn.addEventListener('click', function () {
        // Here you can add logic to run the code from the editors
        const code1 = editor1.getValue();
        const code2 = editor2.getValue();
        console.log('Player 1 Code:', code1);
        console.log('Player 2 Code:', code2);
    });

    // Adjust editors and chat box to fill available space
    function adjustLayout() {
        const gameContainer = document.querySelector('.game-container');
        const availableHeight = window.innerHeight - gameContainer.offsetTop - 60; // Adjust for header and margins
        document.querySelectorAll('.CodeMirror').forEach(editor => {
            editor.style.height = (availableHeight / 2 - 40) + 'px'; // Adjust for padding and margins
        });
        chatBox.style.height = (availableHeight / 2 - 40) + 'px'; // Adjust for padding and margins
    }

    window.addEventListener('resize', adjustLayout);
    adjustLayout();
});

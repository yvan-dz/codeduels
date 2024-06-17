document.addEventListener("DOMContentLoaded", function() {
    setupSocket();
    document.getElementById('run-button').addEventListener('click', runCode);
});

let socket;

function setupSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('code_result', (data) => {
        if (data.error) {
            document.getElementById('output').textContent = 'Error: ' + data.error;
        } else {
            document.getElementById('output').textContent = data.output;
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

function runCode() {
    const code = window.editor.getValue();
    const languageElement = document.getElementById('exercise-language');
    const language = languageElement ? languageElement.textContent.split(': ')[1] : 'java';

    socket.emit('run_code', { language, code });
}

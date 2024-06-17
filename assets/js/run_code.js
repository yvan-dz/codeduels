document.addEventListener("DOMContentLoaded", function() {
    setupSocket();
    const runButton = document.getElementById('run-button');
    if (runButton) {
        runButton.addEventListener('click', function() {
            const user = firebase.auth().currentUser;
            if (user) {
                evaluateCode(user);
            } else {
                console.error('User not authenticated.');
                const outputElement = document.getElementById('output');
                outputElement.textContent = 'Please sign in to run the code.';
                outputElement.style.color = 'red';
            }
        });
    }
});

let socket;

function setupSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('code_result', (data) => {
        const outputElement = document.getElementById('output');
        if (data.error) {
            outputElement.textContent = 'Error: ' + data.error;
            outputElement.style.color = 'red';
        } else {
            outputElement.textContent = 'Feedback: ' + data.output;
            outputElement.style.color = 'green';
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

async function evaluateCode(user) {
    const code = window.editor.getValue();
    const languageElement = document.getElementById('exercise-language');
    if (!languageElement) {
        console.error('Language element not found.');
        return;
    }

    const language = languageElement.textContent.split(': ')[1].toLowerCase();
    const outputElement = document.getElementById('output');
    if (!outputElement) {
        console.error('Output element not found.');
        return;
    }

    outputElement.textContent = 'Evaluating code...';
    outputElement.style.color = 'black';

    try {
        const idToken = await user.getIdToken();
        const payload = {
            code: code,
            language: language,
            idToken: idToken
        };

        socket.emit('run_code', payload);
    } catch (error) {
        console.error('Error:', error);
        outputElement.textContent = 'Error: ' + error.message;
        outputElement.style.color = 'red';
    }
}

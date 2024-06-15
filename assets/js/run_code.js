document.addEventListener("DOMContentLoaded", function() {
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
            language: language
        };

        const response = await fetch('https://codeduels.vercel.app/api/run_code', {  // Stelle sicher, dass die URL korrekt ist
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            outputElement.textContent = 'Feedback: ' + result.output;
            outputElement.style.color = 'green';
        } else {
            outputElement.textContent = 'Error: ' + (result.error || 'Unknown error');
            outputElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        outputElement.textContent = 'Error: ' + error.message;
        outputElement.style.color = 'red';
    }
}

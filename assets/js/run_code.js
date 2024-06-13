document.addEventListener("DOMContentLoaded", function() {
    const runButton = document.getElementById('run-button');
    if (runButton) {
        runButton.addEventListener('click', function() {
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    runCode(user);
                } else {
                    console.error('User not authenticated.');
                }
            });
        });
    }
});

async function runCode(user) {
    console.log('Run code button clicked');

    if (!user) {
        console.error('User object is undefined.');
        return;
    }

    const code = window.editor.getValue();
    console.log('Code:', code);
    const languageElement = document.getElementById('exercise-language');
    if (!languageElement) {
        console.error('Language element not found.');
        return;
    }

    const language = languageElement.textContent.split(': ')[1];
    console.log('Language:', language);

    const outputElement = document.getElementById('output');
    if (!outputElement) {
        console.error('Output element not found.');
        return;
    }

    outputElement.textContent = 'Running code...';
    outputElement.style.color = 'black';

    try {
        const idToken = await user.getIdToken();

        const payload = {
            language: language,
            code: code,
            idToken: idToken
        };

        console.log('Payload:', payload);

        fetch('https://codeduels-dkocozwjw-yvan-dzefaks-projects.vercel.app/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            console.log('Result:', result);
            if (result.error) {
                outputElement.textContent = 'Error: ' + result.error;
                outputElement.style.color = 'red';
            } else {
                outputElement.textContent = 'Output: ' + result.output;
                outputElement.style.color = 'green';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            outputElement.textContent = 'Error: ' + error.message;
            outputElement.style.color = 'red';
        });
    } catch (error) {
        console.error('Error getting ID token:', error);
    }
}

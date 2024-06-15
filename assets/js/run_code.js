document.addEventListener("DOMContentLoaded", function() {
    const runButton = document.getElementById('run-button');
    if (runButton) {
        runButton.addEventListener('click', function() {
            const user = firebase.auth().currentUser;
            if (user) {
                runCode(user);
            } else {
                console.error('User not authenticated.');
            }
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

    const language = languageElement.textContent.split(': ')[1].toLowerCase();
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
            files: [{ name: "main", content: code }]
        };

        console.log('Payload:', payload);

        const proxyUrl = "http://localhost:3000/proxy"; // Verwende deinen eigenen Proxy-Server
        const targetUrl = "https://glot.io/api/run/" + language;
        fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': '3a03d656-e2cc-4af6-b277-5cf3df6e47e4' // Ersetze durch deinen Glot.io-Token
            },
            body: JSON.stringify({ url: targetUrl, options: { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } } })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(result => {
            console.log('Result:', result);
            if (result.error) {
                outputElement.textContent = 'Error: ' + result.error;
                outputElement.style.color = 'red';
            } else {
                outputElement.textContent = 'Output: ' + result.stdout;
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

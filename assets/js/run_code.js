document.addEventListener("DOMContentLoaded", function() {
    const runButton = document.getElementById('run-button');
    if (runButton) {
        runButton.addEventListener('click', runCode);
    }
});

function runCode() {
    console.log('Run code button clicked');
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

    const payload = {
        language: language,
        code: code
    };

    console.log('Payload:', payload);

    fetch('https://codeduels.vercel.app/api/execute', {  // Die richtige API-URL verwenden
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
}

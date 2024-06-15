async function runCode(user) {
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

    outputElement.textContent = 'Running code...';
    outputElement.style.color = 'black';

    try {
        const idToken = await user.getIdToken();
        const payload = {
            language: language,
            code: code
        };

        const response = await fetch('http://localhost:5000/run_code', {  // Passe hier die URL zu deinem Backend an
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.error) {
            outputElement.textContent = 'Error: ' + result.error;
            outputElement.style.color = 'red';
        } else {
            outputElement.textContent = 'Output: ' + result.output;
            outputElement.style.color = 'green';
        }
    } catch (error) {
        console.error('Error:', error);
        outputElement.textContent = 'Error: ' + error.message;
        outputElement.style.color = 'red';
    }
}

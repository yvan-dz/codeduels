document.addEventListener("DOMContentLoaded", function() {
    loadRandomExercise();
    document.getElementById('run-button').addEventListener('click', runCode);
});

function loadRandomExercise() {
    fetch('assets/js/java_exercises.json')
        .then(response => response.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * data.length);
            const exercise = data[randomIndex];
            const exerciseInfo = `
                <h3 id="exercise-name">Exercise: ${exercise.title}</h3>
                <h4 id="exercise-language">Programming language: ${exercise.language}</h4>
                <h5 id="exercise-difficulty">Exercise difficulty: ${exercise.difficulty}</h5>
                <p id="exercise-description">${exercise.description}</p>
            `;
            document.getElementById('exercise-info').innerHTML = exerciseInfo;
            initializeMonaco(exercise.language.toLowerCase());
        })
        .catch(error => console.error('Error loading exercises:', error));
}

function initializeMonaco(language) {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES6,
            allowNonTsExtensions: true
        });

        window.editor = monaco.editor.create(document.getElementById('code-editor'), {
            value: '// your code here',
            language: language,
            theme: 'vs-dark',
            automaticLayout: true
        });

        if (language === 'java') {
            monaco.languages.registerCompletionItemProvider('java', {
                provideCompletionItems: function() {
                    return {
                        suggestions: [
                            {
                                label: 'System.out.println',
                                kind: monaco.languages.CompletionItemKind.Function,
                                insertText: 'System.out.println(${1:object});',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Prints the given object to the console.'
                            }
                        ]
                    };
                }
            });
        }
    });
}

async function runCode() {
    const code = window.editor.getValue();
    const languageElement = document.getElementById('exercise-language');
    const language = languageElement ? languageElement.textContent.split(': ')[1] : 'java';

    /*try {
        const response = await fetch('coderun', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ language, code }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        document.getElementById('output').textContent = result.output;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('output').textContent = 'Error running code';
    }*/

        // start.js
const express = require('express');
const app = express();

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

app.get('/name', (req, res) => {
    const spawn = require('child_process').spawn;
    const process = spawn('java', ['./Hello', req.query.firstname, req.query.lastname]);

    process.stdout.on('data', (data) => {
        res.send(data.toString());
    });
});

}

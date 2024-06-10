document.addEventListener("DOMContentLoaded", function() {
    loadRandomExercise();
});

function loadRandomExercise() {
    fetch('assets/js/cpp_exercises.json')
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
            initializeMonaco('cpp');
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
            language: language.toLowerCase(),
            theme: 'vs-dark',
            automaticLayout: true
        });

        // Enable IntelliSense for C++
        monaco.languages.registerCompletionItemProvider('cpp', {
            provideCompletionItems: function() {
                return {
                    suggestions: [
                        {
                            label: 'std::cout',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: 'std::cout << ${1:object} << std::endl;',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Prints the given object to the console.'
                        }
                    ]
                };
            }
        });
    });
}

function runCode() {
    const code = window.editor.getValue();
    try {
        // Code execution for C++ can be complex and typically requires a backend service
        console.log('Code execution is not supported for C++ in this example.');
    } catch (error) {
        console.error('Error executing code:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var editor1 = CodeMirror.fromTextArea(document.getElementById('editor1'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'default'
    });
    
    var editor2 = CodeMirror.fromTextArea(document.getElementById('editor2'), {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'default'
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
});

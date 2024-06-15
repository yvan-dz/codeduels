const functions = require('firebase-functions');
const { exec } = require('child_process');
const cors = require('cors')({ origin: true });

exports.executeCode = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        const { language, code } = req.body;

        let command;
        switch (language.toLowerCase()) {
            case 'python':
                command = `python -c "${code}"`;
                break;
            case 'javascript':
                command = `node -e "${code}"`;
                break;
            case 'java':
                // Assuming 'java_code' directory and 'Main.java' as a template.
                const fs = require('fs');
                const filePath = '/tmp/Main.java';
                fs.writeFileSync(filePath, code);
                command = `javac ${filePath} && java -cp /tmp Main`;
                break;
            default:
                res.status(400).send({ error: 'Unsupported language' });
                return;
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                res.status(400).send({ error: stderr });
                return;
            }
            res.send({ output: stdout });
        });
    });
});

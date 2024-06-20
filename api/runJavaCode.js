const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    if (req.method === 'POST') {
        const { code } = req.body;

        const filePath = path.join('/tmp', 'Main.java');
        fs.writeFileSync(filePath, code);

        exec(`javac ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).json({ output: stderr });
                return;
            }

            exec(`java -cp /tmp Main`, (error, stdout, stderr) => {
                if (error) {
                    res.status(500).json({ output: stderr });
                    return;
                }

                res.status(200).json({ output: stdout });
            });
        });
    } else {
        res.status(405).json({ message: 'Only POST requests are allowed' });
    }
}

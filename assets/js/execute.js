async function executeCode(language, versionIndex, code) {
    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ language, versionIndex, code })
        });

        const data = await response.json();

        return data.output || 'Error: ' + (data.error || 'Unknown error');
    } catch (error) {
        return 'Error: ' + error.message;
    }
}

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess

app = Flask(__name__)
CORS(app)

@app.route('/execute', methods=['POST'])
def execute_code():
    data = request.json
    code = data.get('code', '')

    try:
        # Schreibe den Code in eine temporäre Datei
        with open('temp_code.py', 'w') as file:
            file.write(code)

        # Führe den Code in der Datei aus und fange die Ausgabe ab
        result = subprocess.run(['python', 'temp_code.py'], capture_output=True, text=True)

        # Lösche die temporäre Datei
        subprocess.run(['rm', 'temp_code.py'])

        return jsonify({'output': result.stdout, 'error': result.stderr})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)

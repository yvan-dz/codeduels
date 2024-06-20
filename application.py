from flask import Flask, request, jsonify
import openai

app = Flask(__name__)

openai.api_key = 'sk-proj-O517uUJtqmOGkDaQYiqeT3BlbkFJgzy4e81wALByy70J69K7'

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=150
    )
    
    return jsonify(response.choices[0].text.strip())

if __name__ == '__main__':
    app.run(debug=True)

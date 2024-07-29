from flask import Flask, request, render_template
from rag_system import rag_system

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    query = request.form['query']
    response = rag_system.answer_query(query)
    return render_template('index.html', query=query, response=response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

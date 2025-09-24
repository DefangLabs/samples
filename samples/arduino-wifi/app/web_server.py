from flask import Flask, jsonify, request

app = Flask(__name__)

# Sample data
tasks = [
    {"id": 1, "title": "Defang x Arduino x Flask example!", "done": False},
    {"id": 2, "title": "Pings appear on browser refresh when device is connected.", "done": False}
]

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Defang x Arduino x Flask. Go to /tasks to see example!"})

@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify({"tasks": tasks})

@app.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = next((task for task in tasks if task['id'] == task_id), None)
    if task:
        return jsonify({"task": task})
    return jsonify({"error": "Task not found"}), 404

@app.route('/tasks', methods=['POST'])
def create_task():
    if not request.json or 'title' not in request.json:
        return jsonify({"error": "Bad request"}), 400
    task = {
        'id': tasks[-1]['id'] + 1,
        'title': request.json['title'],
        'done': False
    }
    tasks.append(task)
    return jsonify({"task": task}), 201

if __name__ == '__main__':
    app.run(debug=True, port=8081, host="0.0.0.0")
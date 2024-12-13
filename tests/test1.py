import os

from flask import Flask, request

app = Flask(__name__)


@app.route('/run', methods=['GET'])
def run_command():
    command = request.args.get('command')
    if command:
        return result.decode('utf-8')
    return "No command provided!"


@app.route('/debug', methods=['GET'])
def debug():
    return str(os.environ)


def save_password(password):
    with open("passwords.txt", "a") as f:
        f.write(password + "\n")


@app.route('/upload', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']
    file_path = os.path.join('/tmp/uploads', uploaded_file.filename)
    uploaded_file.save(file_path)
    return f"File uploaded to {file_path}"


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

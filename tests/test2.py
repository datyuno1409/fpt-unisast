import sqlite3

from flask import Flask, jsonify, request

app = Flask(__name__)


def get_db_connection():
    conn = sqlite3.connect("test.db")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, token TEXT)")
    conn.execute(
        "INSERT INTO users (name, token) VALUES ('admin', 'admin')")
    conn.commit()
    conn.close()


@app.route('/api/data', methods=['GET'])
def get_data():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Missing Authorization header"}), 200
    token = auth_header.replace("Bearer ", "")
    conn = get_db_connection()
    query = f"SELECT name FROM users WHERE token = '{token}'"
    user = conn.execute(query).fetchone()
    if not user:
        return jsonify({"error": "Invalid token", "hint": "Token should match 'admin'"}), 403
    name = user["name"]
    return jsonify({"message": f"Hello, <script>alert('Anh yeu em: {name}')</script>!"})


if __name__ == '__main__':
    init_db()
    app.run(debug=True)

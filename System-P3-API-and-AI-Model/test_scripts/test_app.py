# test_app.py - Minimal Flask app to test
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello World!"

@app.route('/health')
def health():
    return "OK", 200

if __name__ == '__main__':
    print("Starting minimal Flask app...")
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
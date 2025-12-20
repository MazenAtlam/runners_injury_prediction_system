from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('API_PORT', 7860))
    host = os.environ.get('API_HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=True)  # Put debug=False for production
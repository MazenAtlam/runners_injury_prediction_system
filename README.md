# Runners Injury Prediction System

A comprehensive, full-stack application designed to monitor athletes, analyze running sessions, and predict potential injuries using machine learning. The system consists of a Flask-based backend API integrated with a machine learning model, and a React Native mobile application for athletes and coaches.

## Table of Contents

- [Project Structure](#project-structure)
- [AI Model Details](#ai-model-details)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Testing](#testing)
- [License](#license)

## Project Structure

The repository is divided into two primary subsystems:

1. **`System-P3-API-and-AI-Model/` (Backend & AI)**

   - A Python Flask API serving as the backbone of the system.

   - Handles user authentication (JWT), database operations (SQLAlchemy) for athletes, coaches, running sessions, and sensor data.

   - Integrates a pre-trained machine learning model (`runners_injury_prediction_model.pkl`) to calculate injury risk.

   - Includes Docker support for containerized deployment.

2. **`System-P4-Mobile-App/RunnerInjuryApp_Final/` (Frontend/Mobile)**

   - A React Native application built with Expo.

   - Features dedicated screens for User Dashboards, Profile Management, Session Tracking, and Bluetooth/Sensor Mock Connections.

   - Communicates directly with the backend API to provide real-time injury alerts and insights.

## AI Model Details

The machine learning model used in this system was trained on multimodal sports data to effectively predict the likelihood of injuries.

- **Model Training Dataset:** [Multimodal Sports Injury Dataset (Kaggle)](https://www.kaggle.com/datasets/anjalibhegam/multimodal-sports-injury-dataset)

- **Model Training Notebook:** [Google Colab Notebook](https://colab.research.google.com/drive/10TVJV5eE6YE_N39sAzarU5Y-wRWpKKK0?usp=sharing)

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

**Backend Prerequisites:**

- Python 3.8 or higher

- pip (Python package installer)

- Docker (Optional, if you prefer containerized deployment)

**Mobile App Prerequisites:**

- Node.js (v14.x or newer) and npm

- [Expo CLI](https://docs.expo.dev/get-started/installation/)

- Expo Go app on your iOS or Android device (for physical device testing), or a configured emulator (Android Studio / Xcode).

## Quick Start

Follow these steps to get both the backend and frontend up and running locally.

### 1. Starting the Backend API

    **Option A: Local Virtual Environment**

    ```bash
    # Navigate to the backend directory
    cd System-P3-API-and-AI-Model

    # Create and activate a virtual environment
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\\Scripts\\activate`

    # Install dependencies
    pip install -r requirements.txt

    # Run the Flask application
    python run.py
    ```

    *The API will typically be available at `http://localhost:5000` or `http://127.0.0.1:5000`.*

    **Option B: Using Docker**

    ```bash
    # Navigate to the backend directory
    cd System-P3-API-and-AI-Model

    # Build the Docker image
    docker build -t runners-api .

    # Run the container
    docker run -p 5000:5000 runners-api
    ```

### 2. Starting the Mobile Application

    ```bash
    # Navigate to the mobile app directory
    cd System-P4-Mobile-App/RunnerInjuryApp_Final

    # Install npm dependencies
    npm install

    # Start the Expo development server
    npx expo start
    ```

    *Once the Expo server starts, you can scan the generated QR code using the Expo Go app on your phone, or press 'a'/'i' to open it in a local emulator.*

## Testing

The backend API includes a comprehensive suite of test scripts to verify the functionality of database models, CRUD endpoints, user authentication, and AI model predictions.

To run the tests:

    ```bash
    cd System-P3-API-and-AI-Model
    # Run individual test scripts found in the test_scripts/ directory
    python test_scripts/test_app.py
    python test_scripts/test_runners_model_predict.py
    ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

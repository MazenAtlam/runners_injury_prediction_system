import os
import joblib

# Use a dictionary to manage state mutable across functions
model_state = {
    'model': None,
    'scaler': None,
    'feature_names': None,
    'performance': None,
    'status': 'Not Loaded',
    'error': 'Model loading has not been attempted yet.'
}


def load_runners_model():
    """Loads the model artifacts from disk."""
    global model_state

    # Check dependencies
    if joblib is None:
        model_state['status'] = 'Error'
        model_state['error'] = "Critical dependency 'joblib' is missing. Please install it."
        print(f"x {model_state['error']}")
        return

    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, 'ai_classification_models', 'runners_injury_prediction_model.pkl')

        if not os.path.exists(model_path):
            model_state['status'] = 'Error'
            model_state['error'] = f"Model file not found at: {model_path}"
            print(f"x {model_state['error']}")
            return

        loaded_object = None

        # Try Joblib (Primary method for scikit-learn KNN models)
        try:
            loaded_object = joblib.load(model_path)
        except Exception as e:
            model_state['status'] = 'Error'
            model_state['error'] = f"Joblib load failed: {str(e)}"
            print(f"x {model_state['error']}")
            return

        # Extract components
        if loaded_object:
            if isinstance(loaded_object, dict):
                model_state['model'] = loaded_object.get('model')
                model_state['scaler'] = loaded_object.get('scaler')
                model_state['feature_names'] = loaded_object.get('feature_names')
                model_state['performance'] = loaded_object.get('performance')
            else:
                model_state['model'] = loaded_object

            model_state['status'] = 'Loaded'
            model_state['error'] = ''

        else:
            model_state['status'] = 'Error'
            model_state['error'] = f"Unexpected error"
            print(f"x {model_state['error']}")

    except Exception as e:
        model_state['status'] = 'Error'
        model_state['error'] = f"Unexpected error during loading: {str(e)}"
        print(f"x {model_state['error']}")

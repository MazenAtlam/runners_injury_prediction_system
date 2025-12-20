import sys
import os

# Add the project root to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

try:
    print("Attempting to import load_runners_model...")
    from ..app.utils.load_runners_model import load_runners_model, model, scaler

    print("Calling load_runners_model()...")
    load_runners_model()

    if model is None:
        print("ERROR: Model is None after loading")
        sys.exit(1)
    else:
        print(f"SUCCESS: Model loaded successfully")
        print(f"Model type: {type(model)}")

        if scaler:
            print(f"Scaler type: {type(scaler)}")
        else:
            print("WARNING: Scaler is None")

        sys.exit(0)

except ImportError as e:
    print(f"IMPORT ERROR: {e}")
    print("Current sys.path:", sys.path)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
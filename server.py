"""
Heart Disease Diagnostic Tool - Flask API Server
Serves the web application and provides RESTful endpoints for ML inference.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PKL = os.path.join(BASE_DIR, 'ml', 'heart_model.pkl')
WEIGHTS_JSON = os.path.join(BASE_DIR, 'ml', 'model_weights.json')

FEATURE_NAMES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
    'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

model_bundle = None

def load_model():
    global model_bundle
    if os.path.exists(MODEL_PKL):
        model_bundle = joblib.load(MODEL_PKL)
    elif os.path.exists(WEIGHTS_JSON):
        with open(WEIGHTS_JSON, 'r', encoding='utf-8') as f:
            model_bundle = json.load(f)

load_model()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Heart Disease Diagnostic Tool API',
        'model_loaded': model_bundle is not None
    })

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    if not os.path.exists(WEIGHTS_JSON):
        return jsonify({'error': 'Model weights not found. Run ml/train_model.py first.'}), 404
    with open(WEIGHTS_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify({
        'metrics': data.get('metrics'),
        'feature_importances': data.get('feature_importances_rf'),
        'coefficients': data.get('feature_coefficients')
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    global model_bundle
    if model_bundle is None:
        load_model()
    if model_bundle is None:
        return jsonify({'error': 'Model not trained yet. Run ml/train_model.py'}), 500

    data = request.get_json(force=True)
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    # Ensure all features exist
    try:
        features = [float(data.get(feat, 0)) for feat in FEATURE_NAMES]
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid feature value: {str(e)}'}), 400

    # Run inference
    if isinstance(model_bundle, dict) and 'model' in model_bundle:
        scaler = model_bundle['scaler']
        model = model_bundle['model']
        df_feat = pd.DataFrame([features], columns=FEATURE_NAMES)
        X_scaled = scaler.transform(df_feat)
        prob = float(model.predict_proba(X_scaled)[0][1])
        pred = int(model.predict(X_scaled)[0])
    else:
        # Fallback to weights calculation: sigmoid(w * x_scaled + b)
        means = np.array(model_bundle['scaler']['mean'])
        scales = np.array(model_bundle['scaler']['scale'])
        weights = np.array(model_bundle['weights'])
        intercept = model_bundle['intercept']

        x_scaled = (np.array(features) - means) / scales
        z = np.dot(weights, x_scaled) + intercept
        prob = float(1.0 / (1.0 + np.exp(-z)))
        pred = int(prob >= 0.5)

    risk_percentage = round(prob * 100, 1)

    if risk_percentage < 30:
        risk_level = 'Low Risk'
        color = '#10b981'
    elif risk_percentage < 60:
        risk_level = 'Moderate Risk'
        color = '#f59e0b'
    elif risk_percentage < 85:
        risk_level = 'High Risk'
        color = '#f97316'
    else:
        risk_level = 'Critical Risk'
        color = '#ef4444'

    return jsonify({
        'prediction': pred,
        'has_disease': pred == 1,
        'probability': round(prob, 4),
        'risk_percentage': risk_percentage,
        'risk_level': risk_level,
        'badge_color': color
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Heart Disease Diagnostic Tool server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)

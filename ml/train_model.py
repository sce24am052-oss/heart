"""
Heart Disease Diagnostic Tool - Machine Learning Training Pipeline
Dataset: Cleveland Heart Disease Dataset (UCI Machine Learning Repository)
Task: Binary Classification (0 = No Heart Disease, 1 = Heart Disease Present)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)

def train_and_export():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'heart.csv')
    weights_json_path = os.path.join(base_dir, 'ml', 'model_weights.json')
    js_model_path = os.path.join(base_dir, 'js', 'model-data.js')
    pkl_model_path = os.path.join(base_dir, 'ml', 'heart_model.pkl')

    print(f"[1/5] Loading clinical dataset from {data_path}...")
    df = pd.read_csv(data_path)
    print(f"      Dataset loaded: {df.shape[0]} patients, {df.shape[1]} features.")

    feature_names = [
        'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
        'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
    ]
    target_name = 'target'

    X = df[feature_names]
    # In the raw Kaggle Cleveland CSV, 0 denotes presence of disease and 1 denotes absence.
    # We standardize to clinical convention: 1 = Heart Disease Present, 0 = Healthy / No Disease.
    y = 1 - df[target_name]

    print(f"      Standardized Target: 1 = Heart Disease ({sum(y == 1)}), 0 = Healthy ({sum(y == 0)})")

    # Train / Test Split
    print("[2/5] Splitting data (80% Train, 20% Test) with stratification...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Feature Scaling
    print("[3/5] Standardizing clinical features using StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Model Training: Logistic Regression (Interpretable, calibrated probabilities)
    print("[4/5] Training calibrated Logistic Regression and Random Forest models...")
    lr_model = LogisticRegression(
        C=0.5,
        solver='lbfgs',
        max_iter=1000,
        random_state=42
    )
    lr_model.fit(X_train_scaled, y_train)

    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=5,
        min_samples_split=4,
        random_state=42
    )
    rf_model.fit(X_train, y_train)

    # Evaluation
    y_pred = lr_model.predict(X_test_scaled)
    y_prob = lr_model.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred).tolist()

    # 5-fold Cross Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(lr_model, scaler.fit_transform(X), y, cv=cv, scoring='accuracy')

    # ROC curve points for plotting
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_points = [{'fpr': round(float(f), 4), 'tpr': round(float(t), 4)} for f, t in zip(fpr, tpr)]

    # Feature Importances (Random Forest) and Coefficients (Logistic Regression)
    coefficients = {feature_names[i]: float(lr_model.coef_[0][i]) for i in range(len(feature_names))}
    rf_importances = {feature_names[i]: float(rf_model.feature_importances_[i]) for i in range(len(feature_names))}

    # Feature statistics for client-side normalization & radar baseline
    feature_stats = {}
    for col in feature_names:
        feature_stats[col] = {
            'mean': float(df[col].mean()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max()),
            'median': float(df[col].median()),
            'healthy_mean': float(df[y == 0][col].mean()),
            'disease_mean': float(df[y == 1][col].mean()),
        }

    # Serialization Bundle
    model_payload = {
        'model_name': 'Logistic Regression (L2 Regularized)',
        'benchmark_dataset': 'UCI Cleveland Heart Disease (303 records)',
        'target_classes': {'0': 'No Heart Disease', '1': 'Heart Disease Detected'},
        'feature_names': feature_names,
        'scaler': {
            'mean': [float(m) for m in scaler.mean_],
            'scale': [float(s) for s in scaler.scale_]
        },
        'weights': [float(w) for w in lr_model.coef_[0]],
        'intercept': float(lr_model.intercept_[0]),
        'feature_coefficients': coefficients,
        'feature_importances_rf': rf_importances,
        'feature_stats': feature_stats,
        'metrics': {
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4),
            'roc_auc': round(float(auc), 4),
            'cv_accuracy_mean': round(float(cv_scores.mean()), 4),
            'cv_accuracy_std': round(float(cv_scores.std()), 4),
            'confusion_matrix': {
                'tn': cm[0][0],
                'fp': cm[0][1],
                'fn': cm[1][0],
                'tp': cm[1][1]
            },
            'roc_points': roc_points
        }
    }

    print("[5/5] Exporting model weights and artifacts...")
    # 1. JSON weights
    with open(weights_json_path, 'w', encoding='utf-8') as f:
        json.dump(model_payload, f, indent=2)
    print(f"      Saved JSON weights to: {weights_json_path}")

    # 2. JavaScript bundle for client-side execution (No CORS/HTTP server required)
    js_content = f"// Automatically generated by ml/train_model.py\nwindow.MODEL_DATA = {json.dumps(model_payload, indent=2)};\n"
    with open(js_model_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"      Saved JS engine bundle to: {js_model_path}")

    # 3. Joblib pickle for Python server
    joblib.dump({
        'scaler': scaler,
        'model': lr_model,
        'rf_model': rf_model,
        'features': feature_names,
        'metrics': model_payload['metrics']
    }, pkl_model_path)
    print(f"      Saved Python pickle model to: {pkl_model_path}")

    print("\n" + "="*55)
    print("           MODEL TRAINING RESULTS           ")
    print("="*55)
    print(f" Test Accuracy:      {acc*100:.2f}%")
    print(f" 5-Fold CV Accuracy: {cv_scores.mean()*100:.2f}% (+/- {cv_scores.std()*100:.2f}%)")
    print(f" Sensitivity/Recall: {rec*100:.2f}%")
    print(f" Precision:          {prec*100:.2f}%")
    print(f" F1-Score:           {f1*100:.2f}%")
    print(f" ROC-AUC Score:      {auc*100:.2f}%")
    print(f" Confusion Matrix:   TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print("="*55 + "\n")

if __name__ == '__main__':
    train_and_export()

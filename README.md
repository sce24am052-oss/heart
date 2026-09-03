# 🫀 Heart Disease Diagnostic Tool

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?style=for-the-badge&logo=github)](https://pages.github.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://python.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3%2B-orange?style=for-the-badge&logo=scikit-learn)](https://scikit-learn.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Accuracy](https://img.shields.io/badge/CV%20Accuracy-83.5%25-teal?style=for-the-badge)](#-model-architecture--performance)
[![Sensitivity](https://img.shields.io/badge/Sensitivity-90.9%25-success?style=for-the-badge)](#-model-architecture--performance)

> An interactive clinical decision-support web platform and machine learning binary classifier that predicts the likelihood of coronary artery disease using 13 physiological, hemodynamic, and electrocardiographic parameters. Based on the gold-standard **UCI Cleveland Heart Disease** benchmark dataset.

---

## 🌟 Key Features

- **⚡ Dual-Engine Architecture**:
  - **Zero-Dependency Static Client**: Runs 100% in any modern browser via GitHub Pages or local double-click with zero backend requirements.
  - **Python ML Pipeline & REST API**: Includes full Scikit-Learn training pipeline (`train_model.py`) and Flask API (`server.py`).
- **🩺 Comprehensive Diagnostic Assessment**:
  - 13 clinical biomarkers organized into: Demographics, Hemodynamics & Lipids, ECG & Stress Testing, and Fluoroscopy/Thalassemia.
  - Interactive sliders, numerical inputs, and categorical selectors with inline clinical reference tooltips.
  - **One-Click Patient Presets**: Test instantly with *Healthy Athlete (35yo)*, *Borderline Risk (54yo)*, or *Critical Cardiac Patient (67yo)*.
- **📊 Real-Time Analytics & Visualization**:
  - **Animated Risk Gauge**: Dynamic needle and gradient meter displaying 0–100% disease probability.
  - **Clinical Risk Stratification**: Low Risk (<25%), Moderate Risk (25–50%), High Risk (50–75%), Critical Risk (>75%).
  - **Radar Chart**: Compares the patient's physiological markers against optimal population baselines.
  - **Feature Impact Bar Chart**: Highlights top contributors pushing toward risk vs. protective factors.
- **📁 Batch Patient Screening**:
  - Upload CSV files containing multi-patient cohorts for instant bulk diagnosis.
  - Interactive preview table and downloadable predictions CSV report.
- **🖨️ Printable Medical Report**:
  - Clean, print-formatted clinical summary ready for export as PDF or physical documentation.

---

## 🚀 Live Demo & Deployment to GitHub Pages

### Deploy in 2 Simple Steps:

1. **Push this repository to your GitHub account**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Heart Disease Diagnostic Tool"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub: **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Choose branch: `main` / `root` and click **Save** (or let the included `.github/workflows/deploy.yml` deploy automatically!).
   - Your site will be live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`.

---

## 💻 How to Run Locally

### Option A: Direct Browser (No Installation)
Double-click `index.html` in your file explorer, or run a lightweight Python HTTP server:
```bash
python -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080).

### Option B: Flask API Server
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python server.py
```
Open [http://localhost:5000](http://localhost:5000).

### Option C: Retrain the Machine Learning Model
```bash
python ml/train_model.py
```
This preprocesses `data/heart.csv`, standardizes features, trains the classifier, and exports:
- `ml/model_weights.json`
- `js/model-data.js`
- `ml/heart_model.pkl`

---

## 📈 Model Architecture & Performance

The classifier uses an L2-regularized Logistic Regression model calibrated on the standardized UCI Cleveland dataset ($N = 303$).

### Performance Metrics (Stratified 5-Fold Cross-Validation & Test Set)

| Metric | Score | Clinical Interpretation |
| :--- | :--- | :--- |
| **Test Set Accuracy** | **86.89%** | Strong generalizability on unseen holdout test data |
| **5-Fold Cross-Validation Accuracy** | **83.50% ± 4.01%** | Robust generalization across multiple cross-folds |
| **ROC-AUC Score** | **0.9232 (92.32%)** | High discriminative power between positive/negative cases |
| **Precision (PPV)** | **88.46%** | High confidence when flagging high-risk cases |
| **Sensitivity / Recall** | **82.14%** | Captures 23 of 28 true coronary disease patients in test set |
| **Specificity (TNR)** | **90.91%** | Correctly clears 30 of 33 healthy patients without disease |
| **F1-Score** | **85.19%** | Harmonic mean balancing recall and precision |

### Confusion Matrix (Test Set, N = 61)

```
                     Predicted Healthy (0)    Predicted Heart Disease (1)
Actual Healthy (0)           TN = 30                    FP = 3
Actual Disease (1)           FN = 5                     TP = 23
```

> **Clinical Note**: The model achieves high specificity (**90.91%**) and high precision (**88.46%**), minimizing false alarms while reliably isolating patients requiring priority clinical investigation.

### Mathematical Formulation
Features are standardized via z-score scaling:
$$\mathbf{x}_{\text{scaled}} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$$

The calibrated probability of coronary artery disease presence ($y=1$) is given by:
$$P(\text{Disease}=1 \mid \mathbf{x}) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x}_{\text{scaled}} + b)}}$$

---

## 📖 Clinical Parameters Dictionary

| Parameter | Medical Name | Data Type & Range | Diagnostic Relevance |
| :--- | :--- | :--- | :--- |
| `age` | Patient Age | 29–77 years | Age correlates directly with atherosclerotic plaque burden. |
| `sex` | Biological Sex | `1` = Male; `0` = Female | Premenopausal estrogen provides protective vascular effects. |
| `cp` | Chest Pain Type | `0`: Typical Angina, `1`: Atypical Angina, `2`: Non-anginal, `3`: Asymptomatic | Chief subjective symptom classifying myocardial ischemia. |
| `trestbps` | Resting Blood Pressure | mm Hg ($80 - 200$) | Hypertension causes vascular shear stress and endothelial injury. |
| `chol` | Serum Cholesterol | mg/dL ($126 - 564$) | High LDL fractions lead to coronary arterial atheroma. |
| `fbs` | Fasting Blood Sugar > 120 | `1` = True; `0` = False | Marker for diabetes mellitus, an independent vascular risk factor. |
| `restecg` | Resting ECG | `0`: Normal, `1`: ST-T wave anomaly, `2`: LV Hypertrophy | Identifies baseline myocardial strain or conduction defects. |
| `thalach` | Maximum Heart Rate | 71–202 bpm | Chronotropic deficit indicates exercise-induced ischemia. |
| `exang` | Exercise-Induced Angina | `1` = Yes; `0` = No | Hallmark of hemodynamically significant coronary stenosis. |
| `oldpeak` | ST Depression | 0.0–6.2 mm | Electrocardiographic hallmark of subendocardial ischemia. |
| `slope` | Peak ST Segment Slope | `0`: Upsloping, `1`: Flat, `2`: Downsloping | Downsloping/flat ST segments correlate with multivessel disease. |
| `ca` | Major Vessels Colored | 0–3 vessels | Fluoroscopic calcification correlates with luminal stenosis. |
| `thal` | Thallium Scintigraphy | `1`: Normal, `2`: Fixed Defect, `3`: Reversible Defect | Differentiates reversible ischemia from prior myocardial infarction. |

---

## 📁 Repository Structure

```
.
├── index.html                   # Interactive clinical dashboard & application UI
├── css/
│   └── style.css                # Medical-tech responsive design and print styles
├── js/
│   ├── model-data.js            # Pre-exported model weights, scalers, and metrics
│   ├── model.js                 # Client-side ML inference engine (Sigmoid/Standardizer)
│   ├── chart-config.js          # Chart.js radar, bar, and canvas gauge visualizers
│   └── app.js                   # Application state, presets, CSV batch processor
├── data/
│   └── heart.csv                # UCI Cleveland Heart Disease benchmark dataset (303 rows)
├── ml/
│   ├── train_model.py           # Machine learning training & export pipeline
│   ├── model_weights.json       # Serialized JSON model weights and statistics
│   └── heart_model.pkl          # Scikit-learn serialized joblib model
├── server.py                    # Flask REST API backend
├── requirements.txt             # Python dependencies
├── .gitignore                   # Standard ignore rules
├── LICENSE                      # MIT Open Source License
└── .github/
    └── workflows/
        └── deploy.yml           # Automated GitHub Pages CI/CD workflow
```

---

## 🔬 Dataset Citation

> Detrano, R., Janosi, A., Steinbrunn, W., Pfisterer, M., Schmid, J., Sandhu, S., Guppy, K., Lee, S., & Froelicher, V. (1989). *International application of a new probability algorithm for the diagnosis of coronary artery disease*. The American Journal of Cardiology, 64(5), 304-310.
> Available on the [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/45/heart+disease).

---

## ⚠️ Medical Disclaimer

This project is developed for **computer science research, educational demonstration, and clinical informatics exploration**. It is **not** a certified medical diagnostic device and must **not** be used as a substitute for professional clinical judgment, diagnosis, or treatment. Always seek the advice of a qualified cardiologist or healthcare provider with any medical questions.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

/**
 * Heart Disease Diagnostic Tool - Client-Side ML Inference Engine
 * Mathematical foundation: Standardized Logistic Regression with Sigmoid Activation
 * Formula: P(Disease = 1) = 1 / (1 + exp(-(W * ((X - mean) / scale) + b)))
 */

(function(window) {
    'use strict';

    class HeartDiseasePredictor {
        constructor() {
            this.model = window.MODEL_DATA || null;
            if (!this.model) {
                console.warn('MODEL_DATA not found on window object, checking fallback.');
            }
        }

        /**
         * Predict heart disease probability and risk categorization
         * @param {Object} inputs - Key-value pair of the 13 clinical parameters
         * @returns {Object} Comprehensive clinical assessment object
         */
        predict(inputs) {
            const m = this.model;
            if (!m) {
                throw new Error('Model configuration and weights are not initialized.');
            }

            const featureNames = m.feature_names;
            const means = m.scaler.mean;
            const scales = m.scaler.scale;
            const weights = m.weights;
            const intercept = m.intercept;

            let logit = intercept;
            const featureBreakdown = [];
            const patientVector = [];

            featureNames.forEach((feat, idx) => {
                const rawVal = parseFloat(inputs[feat] !== undefined ? inputs[feat] : m.feature_stats[feat].median);
                patientVector.push(rawVal);

                const mean = means[idx];
                const scale = scales[idx];
                const weight = weights[idx];

                // Standardize
                const scaledVal = (rawVal - mean) / scale;
                const contribution = weight * scaledVal;
                logit += contribution;

                featureBreakdown.push({
                    feature: feat,
                    rawValue: rawVal,
                    scaledValue: scaledVal,
                    weight: weight,
                    contribution: contribution,
                    stat: m.feature_stats[feat]
                });
            });

            // Numerically stable sigmoid function
            const probability = 1 / (1 + Math.exp(-Math.max(Math.min(logit, 20), -20)));
            const riskPercentage = Math.round(probability * 1000) / 10; // e.g. 74.2%
            const binaryClass = probability >= 0.5 ? 1 : 0;

            // Clinical risk stratification
            let riskTier = '';
            let riskColor = '';
            let riskBadgeClass = '';
            let urgencyLevel = '';

            if (riskPercentage < 25) {
                riskTier = 'Low Risk';
                riskColor = '#10b981'; // Emerald green
                riskBadgeClass = 'badge-low';
                urgencyLevel = 'Routine Annual Follow-up';
            } else if (riskPercentage < 50) {
                riskTier = 'Moderate Risk';
                riskColor = '#f59e0b'; // Amber
                riskBadgeClass = 'badge-moderate';
                urgencyLevel = 'Preventive Lifestyle & Outpatient Review';
            } else if (riskPercentage < 75) {
                riskTier = 'High Risk';
                riskColor = '#f97316'; // Orange
                riskBadgeClass = 'badge-high';
                urgencyLevel = 'Priority Cardiology Consultation';
            } else {
                riskTier = 'Critical Risk';
                riskColor = '#ef4444'; // Red
                riskBadgeClass = 'badge-critical';
                urgencyLevel = 'Immediate Comprehensive Cardiac Workup';
            }

            // Clinical Insights & Flagged Markers
            const flaggedFactors = [];
            const clinicalAdvice = [];

            // Chest Pain
            if (inputs.cp === 0) {
                flaggedFactors.push({
                    name: 'Typical Anginal Chest Pain',
                    severity: 'high',
                    desc: 'Presence of substernal chest discomfort typical of coronary artery ischemia.'
                });
                clinicalAdvice.push('Recommended: Cardiology evaluation including exercise stress testing or nuclear myocardial perfusion scan.');
            }

            // ST Depression
            if (inputs.oldpeak > 1.5) {
                flaggedFactors.push({
                    name: `Marked ST Depression (${inputs.oldpeak} mm)`,
                    severity: 'high',
                    desc: 'Significant exercise-induced electrocardiographic ST segment depression, suggestive of myocardial ischemia.'
                });
                clinicalAdvice.push('Urgent: Evaluate for ischemic heart disease and coronary angiography as clinically indicated.');
            }

            // Fluoroscopy Major Vessels
            if (inputs.ca > 0) {
                flaggedFactors.push({
                    name: `Coronary Calcification (${inputs.ca} Major Vessel${inputs.ca > 1 ? 's' : ''} Colored)`,
                    severity: 'critical',
                    desc: 'Positive fluoroscopic vessel fluoroscopy correlates strongly with obstructive coronary artery lesions.'
                });
                clinicalAdvice.push('Recommended: Invasive or CT coronary angiography to assess luminal stenosis.');
            }

            // Thalassemia / Perfusion Defect
            if (inputs.thal === 3) {
                flaggedFactors.push({
                    name: 'Reversible Perfusion Defect (Thalassemia 3)',
                    severity: 'high',
                    desc: 'Indicates transient myocardial hypoperfusion under stress that recovers at rest.'
                });
            } else if (inputs.thal === 2) {
                flaggedFactors.push({
                    name: 'Fixed Defect (Thalassemia 2)',
                    severity: 'moderate',
                    desc: 'Suggests possible prior myocardial infarction or non-viable myocardium area.'
                });
            }

            // Exercise Induced Angina
            if (inputs.exang === 1) {
                flaggedFactors.push({
                    name: 'Exercise-Induced Angina',
                    severity: 'high',
                    desc: 'Chest pain brought on by physical exertion.'
                });
            }

            // Cholesterol
            if (inputs.chol >= 240) {
                flaggedFactors.push({
                    name: `Elevated Serum Cholesterol (${inputs.chol} mg/dL)`,
                    severity: 'moderate',
                    desc: 'Atherogenic hypercholesterolemia above high-risk clinical threshold (>240 mg/dL).'
                });
                clinicalAdvice.push('Lifestyle/Pharmacotherapy: Initiate/adjust statin therapy per lipid guidelines and adopt heart-healthy Mediterranean diet.');
            }

            // Resting BP
            if (inputs.trestbps >= 140) {
                flaggedFactors.push({
                    name: `Stage 2 Hypertension (${inputs.trestbps} mm Hg)`,
                    severity: 'moderate',
                    desc: 'Sustained elevated resting systolic blood pressure increases cardiac workload and vascular strain.'
                });
                clinicalAdvice.push('Hypertension Control: Optimize antihypertensive regimens; target resting BP < 130/80 mm Hg.');
            }

            // Fasting Blood Sugar
            if (inputs.fbs === 1) {
                flaggedFactors.push({
                    name: 'Impaired Fasting Glucose (> 120 mg/dL)',
                    severity: 'moderate',
                    desc: 'Diabetic or prediabetic state accelerates atherosclerotic plaque formation.'
                });
                clinicalAdvice.push('Endocrine Evaluation: Glycated hemoglobin (HbA1c) monitoring and glycemic control.');
            }

            if (clinicalAdvice.length === 0) {
                clinicalAdvice.push('Cardiovascular Maintenance: Maintain balanced nutrition, 150 minutes of weekly moderate aerobic exercise, and annual lipid/blood pressure screening.');
            }

            return {
                prediction: binaryClass,
                hasDisease: binaryClass === 1,
                probability: probability,
                riskPercentage: riskPercentage,
                riskTier: riskTier,
                riskColor: riskColor,
                riskBadgeClass: riskBadgeClass,
                urgencyLevel: urgencyLevel,
                logit: logit,
                featureBreakdown: featureBreakdown,
                flaggedFactors: flaggedFactors,
                clinicalAdvice: clinicalAdvice,
                inputs: inputs,
                timestamp: new Date().toISOString()
            };
        }

        /**
         * Batch prediction for CSV data
         * @param {Array<Object>} rows
         * @returns {Array<Object>}
         */
        predictBatch(rows) {
            return rows.map((row, idx) => {
                try {
                    const res = this.predict(row);
                    return {
                        id: row.id || idx + 1,
                        patientData: row,
                        prediction: res.hasDisease ? 'Heart Disease' : 'Normal / Low Risk',
                        riskPercentage: res.riskPercentage + '%',
                        riskTier: res.riskTier,
                        urgency: res.urgencyLevel
                    };
                } catch (e) {
                    return {
                        id: row.id || idx + 1,
                        patientData: row,
                        prediction: 'Error',
                        riskPercentage: 'N/A',
                        riskTier: 'Error: ' + e.message,
                        urgency: 'N/A'
                    };
                }
            });
        }
    }

    // Export globally
    window.HeartDiseasePredictor = HeartDiseasePredictor;
})(window);

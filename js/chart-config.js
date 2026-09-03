/**
 * Heart Disease Diagnostic Tool - Chart Visualizers (Chart.js & Canvas Gauge)
 */

(function(window) {
    'use strict';

    let radarChartInstance = null;
    let contribChartInstance = null;
    let rocChartInstance = null;

    /**
     * Animate and draw a high-definition radial SVG/Canvas risk gauge
     */
    function updateRiskGauge(canvasId, percentage, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height - 15;
        const radius = Math.min(centerX, centerY) - 20;

        ctx.clearRect(0, 0, width, height);

        // Background Track (Half circle: Math.PI to 2*Math.PI)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Gradient Active Arc
        const endAngle = Math.PI + (percentage / 100) * Math.PI;
        const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
        gradient.addColorStop(0, '#10b981');   // Low risk green
        gradient.addColorStop(0.35, '#f59e0b'); // Moderate amber
        gradient.addColorStop(0.7, '#f97316');  // High orange
        gradient.addColorStop(1, '#ef4444');   // Critical red

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
        ctx.lineWidth = 18;
        ctx.strokeStyle = color || gradient;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Needle indicator
        const needleAngle = Math.PI + (percentage / 100) * Math.PI;
        const needleLength = radius - 15;
        const needleX = centerX + needleLength * Math.cos(needleAngle);
        const needleY = centerY + needleLength * Math.sin(needleAngle);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(needleX, needleY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0f172a';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Center Pivot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    }

    /**
     * Render or update the Clinical Radar Chart
     */
    function renderRadarChart(canvasId, predictionData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        const inputs = predictionData.inputs;
        const stats = window.MODEL_DATA ? window.MODEL_DATA.feature_stats : {};

        // Scale key markers to 0-100 index for radar visualization
        // 100 = High risk / elevated, 0 = Low / optimal
        const normalize = (val, min, max) => Math.min(Math.max(((val - min) / (max - min)) * 100, 0), 100);

        const patientScores = [
            normalize(inputs.age, 30, 75),
            normalize(inputs.trestbps, 100, 180),
            normalize(inputs.chol, 150, 350),
            normalize(220 - inputs.thalach, 30, 140), // Inverted: lower thalach = higher risk
            normalize(inputs.oldpeak, 0, 4.5),
            normalize(inputs.ca, 0, 3)
        ];

        // Healthy baseline typical scores
        const baselineScores = [45, 30, 35, 30, 10, 5];

        const labels = [
            'Age Factor',
            'Resting Blood Pressure',
            'Serum Cholesterol',
            'Exertional HR Deficit',
            'ST Depression (Oldpeak)',
            'Vessel Calcification (CA)'
        ];

        if (radarChartInstance) {
            radarChartInstance.data.datasets[0].data = patientScores;
            radarChartInstance.update();
            return;
        }

        const ctx = canvas.getContext('2d');
        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Patient Clinical Profile',
                        data: patientScores,
                        backgroundColor: 'rgba(239, 68, 68, 0.25)',
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Optimal Reference Baseline',
                        data: baselineScores,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(203, 213, 225, 0.6)' },
                        grid: { color: 'rgba(203, 213, 225, 0.4)' },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            display: false,
                            stepSize: 20
                        },
                        pointLabels: {
                            font: { size: 11, family: "'Inter', sans-serif", weight: '500' },
                            color: '#475569'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 12 },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Math.round(context.raw)}/100`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render horizontal feature contribution chart
     */
    function renderContributionChart(canvasId, featureBreakdown) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        // Sort by magnitude of contribution
        const sorted = [...featureBreakdown].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 7);

        const friendlyNames = {
            'cp': 'Chest Pain Type',
            'oldpeak': 'ST Depression (Oldpeak)',
            'ca': 'Major Vessels Colored (CA)',
            'thal': 'Thalassemia Defect',
            'thalach': 'Max Heart Rate',
            'exang': 'Exercise Angina',
            'sex': 'Biological Sex',
            'trestbps': 'Resting BP',
            'chol': 'Serum Cholesterol',
            'slope': 'ST Slope',
            'restecg': 'Resting ECG',
            'age': 'Age',
            'fbs': 'Fasting Blood Sugar'
        };

        const labels = sorted.map(item => friendlyNames[item.feature] || item.feature);
        const dataValues = sorted.map(item => Math.round(item.contribution * 100) / 100);
        const backgroundColors = dataValues.map(v => v >= 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)');

        if (contribChartInstance) {
            contribChartInstance.data.labels = labels;
            contribChartInstance.data.datasets[0].data = dataValues;
            contribChartInstance.data.datasets[0].backgroundColor = backgroundColors;
            contribChartInstance.update();
            return;
        }

        const ctx = canvas.getContext('2d');
        contribChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Impact on Heart Disease Risk (+ increases, - decreases)',
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: { font: { family: "'Inter', sans-serif" } },
                        title: {
                            display: true,
                            text: 'Log-Odds Model Weight Contribution',
                            font: { size: 11, family: "'Inter', sans-serif" }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { family: "'Inter', sans-serif", size: 11, weight: '500' } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const val = ctx.raw;
                                return val >= 0 
                                    ? ` +${val} (Elevates Cardiac Risk)`
                                    : ` ${val} (Protective Factor)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render ROC Curve
     */
    function renderRocCurve(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart || !window.MODEL_DATA) return;

        const points = window.MODEL_DATA.metrics.roc_points || [];
        const rocData = points.map(p => ({ x: p.fpr, y: p.tpr }));

        const ctx = canvas.getContext('2d');
        rocChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: `Model ROC Curve (AUC = ${window.MODEL_DATA.metrics.roc_auc})`,
                        data: rocData,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Random Chance Baseline (AUC = 0.50)',
                        data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                        borderColor: '#94a3b8',
                        borderWidth: 1.5,
                        borderDash: [6, 6],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: 1,
                        title: { display: true, text: 'False Positive Rate (1 - Specificity)', font: { size: 12 } },
                        grid: { color: 'rgba(226, 232, 240, 0.8)' }
                    },
                    y: {
                        min: 0,
                        max: 1,
                        title: { display: true, text: 'True Positive Rate (Sensitivity / Recall)', font: { size: 12 } },
                        grid: { color: 'rgba(226, 232, 240, 0.8)' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: "'Inter', sans-serif", size: 12 } }
                    }
                }
            }
        });
    }

    window.DiagnosticVisualizers = {
        updateRiskGauge,
        renderRadarChart,
        renderContributionChart,
        renderRocCurve
    };

})(window);

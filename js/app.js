/**
 * Heart Disease Diagnostic Tool - Application Controller
 */

(function() {
    'use strict';

    let predictor = null;
    let currentPrediction = null;
    let batchDataResults = [];

    // Presets definitions
    const PRESETS = {
        healthy: {
            age: 35,
            sex: 0,
            cp: 2,
            trestbps: 115,
            chol: 172,
            fbs: 0,
            restecg: 0,
            thalach: 182,
            exang: 0,
            oldpeak: 0.0,
            slope: 0,
            ca: 0,
            thal: 1
        },
        borderline: {
            age: 54,
            sex: 1,
            cp: 1,
            trestbps: 138,
            chol: 242,
            fbs: 0,
            restecg: 1,
            thalach: 146,
            exang: 0,
            oldpeak: 1.2,
            slope: 1,
            ca: 1,
            thal: 2
        },
        highRisk: {
            age: 67,
            sex: 1,
            cp: 0,
            trestbps: 162,
            chol: 288,
            fbs: 1,
            restecg: 1,
            thalach: 108,
            exang: 1,
            oldpeak: 2.8,
            slope: 2,
            ca: 2,
            thal: 3
        }
    };

    /**
     * Initialize Application
     */
    function init() {
        try {
            predictor = new window.HeartDiseasePredictor();
        } catch (e) {
            console.error('Failed to initialize predictor:', e);
            return;
        }

        // Initialize print date
        const dateEl = document.getElementById('print-date');
        if (dateEl) {
            dateEl.textContent = 'Generated on: ' + new Date().toLocaleString();
        }

        // Render initial ROC curve
        if (window.DiagnosticVisualizers && window.DiagnosticVisualizers.renderRocCurve) {
            setTimeout(() => {
                window.DiagnosticVisualizers.renderRocCurve('rocChart');
            }, 200);
        }

        // Run initial diagnosis with default form values
        runDiagnosis();
    }

    /**
     * Read form parameters
     */
    function getFormInputs() {
        return {
            age: parseFloat(document.getElementById('age').value),
            sex: parseInt(document.getElementById('sex').value, 10),
            cp: parseInt(document.getElementById('cp').value, 10),
            trestbps: parseFloat(document.getElementById('trestbps').value),
            chol: parseFloat(document.getElementById('chol').value),
            fbs: parseInt(document.getElementById('fbs').value, 10),
            restecg: parseInt(document.getElementById('restecg').value, 10),
            thalach: parseFloat(document.getElementById('thalach').value),
            exang: parseInt(document.getElementById('exang').value, 10),
            oldpeak: parseFloat(document.getElementById('oldpeak').value),
            slope: parseInt(document.getElementById('slope').value, 10),
            ca: parseInt(document.getElementById('ca').value, 10),
            thal: parseInt(document.getElementById('thal').value, 10)
        };
    }

    /**
     * Set form values
     */
    function setFormInputs(data) {
        for (const [key, val] of Object.entries(data)) {
            const el = document.getElementById(key);
            if (el) {
                el.value = val;
                if (key === 'age') {
                    syncVal('age', val);
                }
            }
        }
    }

    /**
     * Sync slider label
     */
    window.syncVal = function(id, val) {
        const valEl = document.getElementById('val-' + id);
        if (valEl) {
            valEl.textContent = val + (id === 'age' ? ' yrs' : '');
        }
        runDiagnosis();
    };

    /**
     * Load preset patient profile
     */
    window.loadPreset = function(presetKey) {
        const preset = PRESETS[presetKey];
        if (preset) {
            setFormInputs(preset);
            runDiagnosis();
        }
    };

    /**
     * Reset form to baseline default values
     */
    window.resetForm = function() {
        window.loadPreset('borderline');
    };

    /**
     * Primary diagnostic calculation & UI update
     */
    window.runDiagnosis = function() {
        if (!predictor) return;

        const inputs = getFormInputs();
        const res = predictor.predict(inputs);
        currentPrediction = res;

        // 1. Update Gauge & Percentage
        const percentEl = document.getElementById('risk-percent');
        if (percentEl) {
            percentEl.textContent = `${res.riskPercentage}%`;
            percentEl.style.color = res.riskColor;
        }

        // 2. Update Risk Badge
        const badgeEl = document.getElementById('risk-badge');
        if (badgeEl) {
            badgeEl.className = `risk-badge ${res.riskBadgeClass}`;
            badgeEl.textContent = `${res.riskTier} (${res.hasDisease ? 'Positive' : 'Negative'})`;
        }

        // 3. Update Urgency Text
        const urgencyHeadEl = document.getElementById('urgency-headline');
        const urgencyBodyEl = document.getElementById('urgency-body');
        if (urgencyHeadEl && urgencyBodyEl) {
            urgencyHeadEl.textContent = `${res.riskTier} • ${res.urgencyLevel}`;
            urgencyBodyEl.textContent = res.hasDisease
                ? 'Clinical algorithms detect high concordance with coronary artery disease indicators. Priority clinical verification advised.'
                : 'Cardiovascular parameters fall within low probability thresholds. Maintain lifestyle risk prevention.';
        }

        // 4. Update Flagged Clinical Factors
        const factorsContainer = document.getElementById('flagged-factors-container');
        if (factorsContainer) {
            if (res.flaggedFactors.length === 0) {
                factorsContainer.innerHTML = `
                    <div style="font-size: 0.85rem; color: #10b981; padding: 0.5rem 0;">
                        ✅ No acute cardiovascular risk markers flagged.
                    </div>
                `;
            } else {
                factorsContainer.innerHTML = res.flaggedFactors.map(f => {
                    const dotClass = f.severity === 'critical' ? 'dot-critical' : f.severity === 'high' ? 'dot-high' : 'dot-moderate';
                    return `
                        <div class="factor-item">
                            <div class="factor-dot ${dotClass}"></div>
                            <div class="factor-content">
                                <strong>${f.name}</strong>
                                <span>${f.desc}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 5. Update Care Directives
        const careList = document.getElementById('care-plan-list');
        if (careList) {
            careList.innerHTML = res.clinicalAdvice.map(a => `<li>${a}</li>`).join('');
        }

        // 6. Draw Canvas Gauge
        if (window.DiagnosticVisualizers && window.DiagnosticVisualizers.updateRiskGauge) {
            window.DiagnosticVisualizers.updateRiskGauge('gaugeCanvas', res.riskPercentage, res.riskColor);
        }

        // 7. Update Radar Chart
        if (window.DiagnosticVisualizers && window.DiagnosticVisualizers.renderRadarChart) {
            window.DiagnosticVisualizers.renderRadarChart('radarChart', res);
        }

        // 8. Update Feature Contribution Bar Chart
        if (window.DiagnosticVisualizers && window.DiagnosticVisualizers.renderContributionChart) {
            window.DiagnosticVisualizers.renderContributionChart('contribChart', res.featureBreakdown);
        }
    };

    /**
     * Switch between Single and Batch mode
     */
    window.switchMode = function(mode) {
        const singleContainer = document.getElementById('single-assessment-container');
        const batchContainer = document.getElementById('batch-screening-container');
        const presetsPanel = document.getElementById('presets-panel');
        const tabSingle = document.getElementById('tab-single');
        const tabBatch = document.getElementById('tab-batch');

        if (mode === 'single') {
            singleContainer.style.display = 'grid';
            batchContainer.style.display = 'none';
            presetsPanel.style.display = 'flex';
            tabSingle.classList.add('active');
            tabBatch.classList.remove('active');
        } else {
            singleContainer.style.display = 'none';
            batchContainer.style.display = 'block';
            presetsPanel.style.display = 'none';
            tabSingle.classList.remove('active');
            tabBatch.classList.add('active');
        }
    };

    /**
     * Copy clinical summary to clipboard
     */
    window.copySummaryToClipboard = function() {
        if (!currentPrediction) return;

        const p = currentPrediction;
        const inp = p.inputs;
        const text = [
            '====================================================',
            '   CARDIOPREDICT AI - CLINICAL ASSESSMENT SUMMARY   ',
            '====================================================',
            `Date: ${new Date().toLocaleString()}`,
            `Patient Demographics: ${inp.age} yrs, ${inp.sex === 1 ? 'Male' : 'Female'}`,
            `Resting BP: ${inp.trestbps} mm Hg | Cholesterol: ${inp.chol} mg/dL | Fasting Sugar > 120: ${inp.fbs === 1 ? 'Yes' : 'No'}`,
            `Chest Pain Type: Code ${inp.cp} | Max Heart Rate: ${inp.thalach} bpm | Exercise Angina: ${inp.exang === 1 ? 'Yes' : 'No'}`,
            `ST Depression: ${inp.oldpeak} mm | ST Slope: ${inp.slope} | Major Vessels: ${inp.ca} | Thalassemia: ${inp.thal}`,
            '----------------------------------------------------',
            `DIAGNOSTIC PROBABILITY: ${p.riskPercentage}%`,
            `CLASSIFICATION: ${p.hasDisease ? 'POSITIVE (Heart Disease Detected)' : 'NEGATIVE (No Disease Detected)'}`,
            `RISK STRATIFICATION: ${p.riskTier}`,
            `URGENCY DIRECTIVE: ${p.urgencyLevel}`,
            '----------------------------------------------------',
            'KEY FLAGGED FINDINGS:',
            ...p.flaggedFactors.map(f => ` - [${f.severity.toUpperCase()}] ${f.name}: ${f.desc}`),
            '----------------------------------------------------',
            'CARE RECOMMENDATIONS:',
            ...p.clinicalAdvice.map(a => ` * ${a}`),
            '===================================================='
        ].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            alert('Clinical summary copied to clipboard successfully!');
        }).catch(() => {
            prompt('Copy summary manually:', text);
        });
    };

    /**
     * CSV Batch Processing
     */
    window.handleCsvUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            processCsvText(content);
        };
        reader.readAsText(file);
    };

    function processCsvText(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) {
            alert('The CSV file does not contain enough data.');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split(',').map(v => v.trim());
            const row = { id: i };
            headers.forEach((h, idx) => {
                row[h] = parseFloat(values[idx]);
            });
            rows.push(row);
        }

        batchDataResults = predictor.predictBatch(rows);
        renderBatchTable(batchDataResults);
    }

    function renderBatchTable(results) {
        const resultsArea = document.getElementById('batch-results-area');
        const countEl = document.getElementById('batch-count');
        const tbody = document.getElementById('batch-tbody');

        resultsArea.style.display = 'block';
        countEl.textContent = results.length;
        tbody.innerHTML = '';

        results.slice(0, 50).forEach(item => {
            const d = item.patientData;
            const tr = document.createElement('tr');
            const isDisease = item.prediction === 'Heart Disease';
            const badgeClass = isDisease ? 'badge-high' : 'badge-low';

            tr.innerHTML = `
                <td><strong>#PT-${item.id}</strong></td>
                <td>${d.age || '--'}y / ${d.sex === 1 ? 'M' : 'F'}</td>
                <td>${d.trestbps || '--'} / ${d.chol || '--'}</td>
                <td>Type ${d.cp !== undefined ? d.cp : '--'}</td>
                <td><strong>${item.riskPercentage}</strong></td>
                <td><span class="risk-badge ${badgeClass}" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;">${item.prediction}</span></td>
                <td>${item.riskTier}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${item.urgency}</td>
            `;
            tbody.appendChild(tr);
        });

        if (results.length > 50) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="8" style="text-align: center; color: var(--text-muted); font-style: italic;">Showing first 50 of ${results.length} records. Export full CSV to inspect all entries.</td>`;
            tbody.appendChild(tr);
        }
    }

    /**
     * Download Sample CSV Template
     */
    window.downloadSampleCsv = function() {
        const csvContent = [
            'age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal',
            '35,0,2,115,172,0,0,182,0,0.0,0,0,1',
            '54,1,1,138,242,0,1,146,0,1.2,1,1,2',
            '67,1,0,162,288,1,1,108,1,2.8,2,2,3',
            '44,1,2,130,233,0,1,179,1,0.4,2,0,2',
            '58,0,0,150,270,0,0,111,1,0.8,2,0,3'
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'heart_disease_sample_patients.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Export Batch Results to CSV
     */
    window.exportBatchResultsCsv = function() {
        if (!batchDataResults || batchDataResults.length === 0) {
            alert('No batch results available to export.');
            return;
        }

        const headers = ['Patient_ID', 'Age', 'Sex', 'BP', 'Cholesterol', 'ChestPain', 'MaxHR', 'Risk_Percentage', 'Prediction', 'Risk_Tier', 'Urgency'];
        const rows = batchDataResults.map(r => {
            const d = r.patientData;
            return [
                r.id,
                d.age || '',
                d.sex || '',
                d.trestbps || '',
                d.chol || '',
                d.cp || '',
                d.thalach || '',
                `"${r.riskPercentage}"`,
                `"${r.prediction}"`,
                `"${r.riskTier}"`,
                `"${r.urgency}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'batch_cardiac_predictions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

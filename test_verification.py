"""
Verification test for Heart Disease Diagnostic Tool API & ML Models
"""
import unittest
import json
from server import app

class TestHeartDiseaseDiagnostic(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_endpoint(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['model_loaded'])

    def test_metrics_endpoint(self):
        response = self.client.get('/api/metrics')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('metrics', data)
        self.assertIn('accuracy', data['metrics'])
        self.assertGreater(data['metrics']['accuracy'], 0.75)
        self.assertGreater(data['metrics']['roc_auc'], 0.80)

    def test_predict_healthy_profile(self):
        healthy_patient = {
            'age': 35, 'sex': 0, 'cp': 2, 'trestbps': 115, 'chol': 172,
            'fbs': 0, 'restecg': 0, 'thalach': 182, 'exang': 0, 'oldpeak': 0.0,
            'slope': 0, 'ca': 0, 'thal': 1
        }
        response = self.client.post('/api/predict', json=healthy_patient)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertFalse(data['has_disease'])
        self.assertEqual(data['prediction'], 0)
        self.assertEqual(data['risk_level'], 'Low Risk')

    def test_predict_critical_cardiac_profile(self):
        critical_patient = {
            'age': 67, 'sex': 1, 'cp': 0, 'trestbps': 162, 'chol': 288,
            'fbs': 1, 'restecg': 1, 'thalach': 108, 'exang': 1, 'oldpeak': 2.8,
            'slope': 2, 'ca': 2, 'thal': 3
        }
        response = self.client.post('/api/predict', json=critical_patient)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['has_disease'])
        self.assertEqual(data['prediction'], 1)
        self.assertIn(data['risk_level'], ['High Risk', 'Critical Risk'])

if __name__ == '__main__':
    unittest.main()

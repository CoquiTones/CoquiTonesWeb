import unittest
from mlutil import *
import soundfile as sf
import numpy as np
import sklearn

class TestMLUtil(unittest.TestCase):
    def setUp(self):
        self.audio_file_path = './backend/tests/reg/test_audio.wav'
        with open(self.audio_file_path, 'rb') as file:
            self.audio_file = file
            
    def test_extract_features(self):
        audio_data, sr = sf.read(self.audio_file_path)
        features = extract_features(audio_data, sr)

        self.assertIsNotNone(features, "Extracts something")
        self.assertIsInstance(features, np.ndarray, "Extracts spectrogram array")
        self.assertEqual(features.shape[0], 20, "Spectrogram has 20 coefficient rows")

    def predictor_assertions(self, predictor):
        self.assertIsNotNone(predictor, "Predictor is something")
        self.assertTrue(
            sklearn.multiclass.is_classifier(predictor), 
            "Predictor is multiclass classifier"
            )
        self.assertEqual(
            n_model_input_parameters, predictor.n_features_in_,
            f"Predictor takes expected number of features, {n_model_input_parameters}"
            )

    def test_initialize_predictor(self):
        predictor = initialize_predictor()
        self.predictor_assertions(predictor)

    def test_classify_slice(self):
        predictor = next(get_model())
        rand_x = np.random.default_rng(1917).random((1, n_model_input_parameters))
        prediction = classify_slice(rand_x, predictor)
        self.assertTupleEqual(prediction.shape, (1, 8), 
            "Gets 1 classification across 8 classes"
            )

    def test_classify_audio_file(self):
        predictor = next(get_model())
        classifications = classify_audio_file(self.audio_file_path, predictor)
        self.assertIsInstance(classifications, dict, "Classifications are a dictionary")
        for slice_classification in classifications.values():
            species_in_slice = slice_classification.keys()
            for species_name in species_schema:
                self.assertIn(
                    species_name, 
                    slice_classification, 
                    f"{species_name} classified in all slices"
                    )
            

    def test_get_model(self):
        predictor = next(get_model())
        self.predictor_assertions(predictor)

if __name__ == '__main__':
    unittest.main()
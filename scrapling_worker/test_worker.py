import os
import unittest
from unittest.mock import patch

from scrapling_worker import worker


class WorkerAuthTests(unittest.TestCase):
    def setUp(self):
        self.client = worker.app.test_client()

    @patch.object(worker, "extract_page", return_value={"title": "Extracted"})
    def test_extract_fails_closed_when_server_token_is_unset(self, extract_page):
        with patch.dict(os.environ, {"SCRAPLING_WORKER_TOKEN": ""}, clear=False):
            response = self.client.post(
                "/extract",
                headers={"Authorization": "Bearer any-token"},
                json={"url": "https://example.com/legal"},
            )

        self.assertEqual(response.status_code, 401)
        extract_page.assert_not_called()

    @patch.object(worker, "extract_page", return_value={"title": "Extracted"})
    def test_extraction_routes_reject_missing_or_mismatched_bearer_tokens(self, extract_page):
        with patch.dict(os.environ, {"SCRAPLING_WORKER_TOKEN": "expected-token"}, clear=False):
            missing_token_response = self.client.post(
                "/extract",
                json={"url": "https://example.com/legal"},
            )
            mismatched_token_response = self.client.post(
                "/extract/batch",
                headers={"Authorization": "Bearer wrong-token"},
                json={"items": [{"url": "https://example.com/legal"}]},
            )

        self.assertEqual(missing_token_response.status_code, 401)
        self.assertEqual(mismatched_token_response.status_code, 401)
        extract_page.assert_not_called()

    @patch.object(worker, "extract_page", return_value={"title": "Extracted"})
    def test_valid_bearer_token_allows_extraction_and_health_stays_open(self, extract_page):
        with patch.dict(os.environ, {"SCRAPLING_WORKER_TOKEN": "expected-token"}, clear=False):
            extraction_response = self.client.post(
                "/extract",
                headers={"Authorization": "Bearer expected-token"},
                json={"url": "https://example.com/legal"},
            )
        health_response = self.client.get("/health")

        self.assertEqual(extraction_response.status_code, 200)
        self.assertEqual(health_response.status_code, 200)
        extract_page.assert_called_once()


if __name__ == "__main__":
    unittest.main()

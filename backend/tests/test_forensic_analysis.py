import unittest

from app.services.forensic_analysis import analyze_corrupted_source


class ForensicAnalysisTests(unittest.TestCase):
    def test_detects_recoverable_artifacts(self):
        result = analyze_corrupted_source(
            file_name="damaged_drive.img",
            source_type="disk_image",
            corruption_level="medium",
        )

        self.assertIn("recovered_items", result)
        self.assertGreater(len(result["recovered_items"]), 0)
        self.assertIn("priority_queue", result)
        self.assertGreater(result["recoverability_score"], 0)
        self.assertIn("ai_summary", result)

    def test_prioritizes_high_confidence_documents(self):
        result = analyze_corrupted_source(
            file_name="finance_dump.dd",
            source_type="disk_image",
            corruption_level="low",
        )

        top_item = max(result["recovered_items"], key=lambda item: item["confidence"])
        self.assertIn("pdf", top_item["type"].lower())


if __name__ == "__main__":
    unittest.main()

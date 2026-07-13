import unittest

import pandas as pd

from main import profile_dataframe, safe_client_filename


class DataQualityTests(unittest.TestCase):
    def test_filename_is_reduced_to_safe_basename(self):
        self.assertEqual(safe_client_filename("../../unsafe.csv"), "unsafe.csv")

    def test_column_profiles_and_custom_rules(self):
        frame = pd.DataFrame({
            "customer_id": [1, 1, 3],
            "email": ["valid@example.com", "not-an-email", None],
        })
        profiles, issues, validity = profile_dataframe(frame, {
            "required_columns": ["customer_id", "email"],
            "unique_columns": ["customer_id"],
            "date_columns": [],
        })
        profile_by_name = {item["column_name"]: item for item in profiles}
        self.assertEqual(profile_by_name["email"]["pii_type"], "email")
        self.assertEqual(profile_by_name["email"]["missing_values"], 1)
        self.assertTrue(any(item["issue_type"] == "duplicate_unique_value" for item in issues))
        self.assertLess(validity, 100)


if __name__ == "__main__":
    unittest.main()


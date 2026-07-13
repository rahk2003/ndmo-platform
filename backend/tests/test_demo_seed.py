import unittest

from demo_seed import DOMAINS, QUESTION_TEMPLATES, demo_decision


class DemoSeedTests(unittest.TestCase):
    def test_reference_catalog_has_unique_domains_and_42_questions(self):
        orders = [order for order, _, _ in DOMAINS]
        english_names = [name for _, name, _ in DOMAINS]
        arabic_names = [name for _, _, name in DOMAINS]

        self.assertEqual(len(DOMAINS), 14)
        self.assertEqual(orders, list(range(1, 15)))
        self.assertEqual(len(english_names), len(set(english_names)))
        self.assertEqual(len(arabic_names), len(set(arabic_names)))
        self.assertEqual(len(DOMAINS) * len(QUESTION_TEMPLATES), 42)

    def test_demo_decisions_are_valid_and_cover_every_outcome(self):
        decisions = {
            demo_decision(domain_order, question_number)
            for domain_order, _, _ in DOMAINS
            for question_number, _, _ in QUESTION_TEMPLATES
        }

        self.assertEqual(decisions, {"yes", "partial", "no"})

    def test_generated_question_codes_are_unique(self):
        codes = {
            f"D{domain_order:02d}_Q{question_number:02d}"
            for domain_order, _, _ in DOMAINS
            for question_number, _, _ in QUESTION_TEMPLATES
        }

        self.assertEqual(len(codes), 42)


if __name__ == "__main__":
    unittest.main()

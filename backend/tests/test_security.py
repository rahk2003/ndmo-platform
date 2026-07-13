import unittest

from security import hash_password, hash_token, verify_password


class SecurityTests(unittest.TestCase):
    def test_password_round_trip(self):
        password_hash, salt = hash_password("StrongPassword123")
        self.assertTrue(verify_password("StrongPassword123", password_hash, salt))
        self.assertFalse(verify_password("WrongPassword123", password_hash, salt))

    def test_tokens_are_not_stored_in_plain_text(self):
        self.assertNotEqual(hash_token("secret-session-token"), "secret-session-token")
        self.assertEqual(len(hash_token("secret-session-token")), 64)


if __name__ == "__main__":
    unittest.main()


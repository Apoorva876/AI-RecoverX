import unittest

from app.models.schemas import UserCreate, UserLogin


class AuthValidationTests(unittest.TestCase):
    def test_local_domain_email_is_accepted(self):
        user = UserCreate(name='Investigator One', email='admin@recoverx.local', password='Password123!')
        self.assertEqual(str(user.email), 'admin@recoverx.local')

        login = UserLogin(email='admin@recoverx.local', password='Password123!')
        self.assertEqual(str(login.email), 'admin@recoverx.local')


if __name__ == '__main__':
    unittest.main()

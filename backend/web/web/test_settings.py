"""
Django test settings for pytest.
Overrides production settings for testing.
"""

from web.settings import *  # noqa

# Use SQLite for tests (much faster than MariaDB)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disable password validators for faster test user creation
AUTH_PASSWORD_VALIDATORS = []


# Disable migrations for speed
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


MIGRATION_MODULES = DisableMigrations()

# Speed up password hashing
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Set a simple SECRET_KEY for testing
SECRET_KEY = "test-secret-key-unsafe-do-not-use-in-production"

# Disable debug toolbar and other expensive middleware
MIDDLEWARE = [m for m in MIDDLEWARE if "debug_toolbar" not in m]  # noqa: F405

# Faster CSRF
CSRF_COOKIE_SECURE = False

# Disable cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

from django.core.management.base import BaseCommand

from api.models import User


class Command(BaseCommand):
    help = "Create a new user with admin privileges"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username for the new user")
        parser.add_argument("password", type=str, help="Password for the new user")
        parser.add_argument(
            "--no-admin",
            action="store_true",
            help="Create as regular user instead of admin",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        is_admin = not options["no_admin"]

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR(f'User "{username}" already exists!'))
            return

        # Create user with hashed password
        if is_admin:
            user = User.objects.create_superuser(username, "", password)
            self.stdout.write(
                self.style.SUCCESS(f'✓ Admin user "{username}" created successfully!')
            )
        else:
            user = User.objects.create_user(username, "", password)
            self.stdout.write(self.style.SUCCESS(f'✓ User "{username}" created successfully!'))

        self.stdout.write(f"  Username: {user.username}")
        self.stdout.write(f"  Is Staff: {user.is_staff}")
        self.stdout.write(f"  Is Superuser: {user.is_superuser}")

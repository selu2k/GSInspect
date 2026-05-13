from django.core.management.base import BaseCommand, CommandError
from api.models import User


class Command(BaseCommand):
    help = "Quickly create a GSInspect system user"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username")
        parser.add_argument("password", type=str, help="Password")
        parser.add_argument("--staff", action="store_true", help="Set as staff member (is_staff)")
        parser.add_argument("--dept", type=str, help="Department name", default="")

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        is_staff = options["staff"]
        dept = options["dept"]

        if User.objects.filter(username=username).exists():
            raise CommandError(f'Error: User "{username}" already exists.')

        try:
            # 修复 F841: 如果不需要 user 对象，可以直接调用创建方法
            User.objects.create_user(
                username=username,
                password=password,
                is_staff=is_staff,
                department=dept,
            )
            role = "ADMIN/STAFF" if is_staff else "VIEWER"
            self.stdout.write(
                self.style.SUCCESS(f"Successfully created user: {username} (Role: {role})")
            )
        except Exception as e:
            raise CommandError(f"Failed to create user: {str(e)}")


import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create CMO administrator"

    def handle(self, *args, **options):
        User = get_user_model()
        password = os.environ.get("CMO_ADMIN_PASSWORD")

        if not password:
            raise ValueError("CMO_ADMIN_PASSWORD is missing")

        user, created = User.objects.get_or_create(
            username="cmo_admin",
            defaults={
                "email": "cmo.admin@example.com",
                "first_name": "CMO",
                "last_name": "Administrator",
                "role": "CMO_ADMIN",
            }
        )

        user.role = "CMO_ADMIN"
        user.is_active = True
        user.is_staff = True
        user.set_password(password)
        user.save()

        self.stdout.write(self.style.SUCCESS("CMO admin ready!"))

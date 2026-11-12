
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = [
        ('CITIZEN', 'Citizen'),
        ('CMO_ADMIN', 'CMO Administrator'),
        ('OFFICER', 'Department Officer'),
    ]

    email = models.EmailField(unique=True)

    mobile = models.CharField(
        max_length=15,
        unique=True
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CITIZEN'
    )

    def __str__(self):
        return f"{self.username} - {self.role}"

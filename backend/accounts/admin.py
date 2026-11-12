
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    # Fields displayed when editing an existing user
    fieldsets = UserAdmin.fieldsets + (
        ("Additional Information", {
            "fields": ("mobile", "role")
        }),
    )

    # Fields displayed when creating a new user
    add_fieldsets = UserAdmin.add_fieldsets + (
    ("Additional Information", {
        "fields": ("email", "mobile", "role")
        }),
    )

    # Columns displayed in the user list
    list_display = (
        "username",
        "email",
        "mobile",
        "role",
        "is_staff",
    )

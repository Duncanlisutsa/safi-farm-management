from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "System Admin"
        EXECUTIVE = "executive", "Executive Manager"
        FARM_MANAGER = "farm_manager", "Farm Manager"
        FARM_ATTENDANT = "farm_attendant", "Farm Attendant"
        PIG_ATTENDANT = "pig_attendant", "Pig Attendant"
        FISH_ATTENDANT = "fish_attendant", "Fish Attendant"
        FACTORY_WORKER = "factory_worker", "Factory Worker"

    role = models.CharField(max_length=20, choices=Role.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
from django.db import models
from django.conf import settings


class EmployeeProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employee_profile"
    )
    phone_number = models.CharField(max_length=20)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    kra_pin = models.CharField(max_length=20, blank=True, null=True)
    id_document = models.FileField(upload_to="employee_ids/", blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.user.username} — Employee Profile"
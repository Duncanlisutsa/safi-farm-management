from django.db import models
from django.conf import settings


class Task(models.Model):
    class Category(models.TextChoices):
        CROPS = "crops", "Crops"
        PIGS = "pigs", "Pigs"
        FISH = "fish", "Fish"
        FACTORY = "factory", "Factory"
        TEA = "tea", "Tea"
        GENERAL = "general", "General"

    class DayOfWeek(models.TextChoices):
        MONDAY = "monday", "Monday"
        TUESDAY = "tuesday", "Tuesday"
        WEDNESDAY = "wednesday", "Wednesday"
        THURSDAY = "thursday", "Thursday"
        FRIDAY = "friday", "Friday"
        SATURDAY = "saturday", "Saturday"
        SUNDAY = "sunday", "Sunday"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        IN_PROGRESS = "in_progress", "In Progress"
        DONE = "done", "Done"
        CANCELLED = "cancelled", "Cancelled"

    title = models.CharField(max_length=255)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="assigned_tasks"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="created_tasks"
    )
    category = models.CharField(max_length=20, choices=Category.choices)
    week_start_date = models.DateField()
    day_of_week = models.CharField(max_length=10, choices=DayOfWeek.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["week_start_date", "day_of_week"]

    def __str__(self):
        return f"{self.title} ({self.assigned_to.username}, {self.day_of_week})"
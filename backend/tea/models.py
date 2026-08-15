from django.db import models
from django.conf import settings


class TeaHarvestLog(models.Model):
    class Grade(models.TextChoices):
        A = "A", "Grade A"
        B = "B", "Grade B"
        C = "C", "Grade C"

    week_number = models.PositiveSmallIntegerField()  # ISO week number
    harvest_date = models.DateField()
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    grade = models.CharField(max_length=1, choices=Grade.choices)
    plots_harvested = models.CharField(max_length=255, blank=True, null=True)
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="tea_logs"
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-harvest_date"]

    def __str__(self):
        return f"Week {self.week_number} - {self.quantity_kg}kg (Grade {self.grade})"
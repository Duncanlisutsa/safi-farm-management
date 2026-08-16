from django.db import models
from django.conf import settings


class PoultryBatch(models.Model):
    class Species(models.TextChoices):
        CHICKEN = "chicken", "Chicken"
        GOOSE = "goose", "Goose"
        DUCK = "duck", "Duck"
        TURKEY = "turkey", "Turkey"
        OTHER = "other", "Other"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        MIXED = "mixed", "Mixed"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        DECEASED = "deceased", "Deceased"

    batch_name = models.CharField(max_length=100)  # e.g. "Chicken Batch A", "Geese Pen 1"
    species = models.CharField(max_length=20, choices=Species.choices)
    breed = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MIXED)
    count = models.PositiveIntegerField()
    average_size_kg = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    is_layer = models.BooleanField(default=False)  # chicken-specific: laying flock vs broiler/other
    date_of_birth = models.DateField(blank=True, null=True)
    acquisition_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="poultry_batches_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["species", "batch_name"]

    def __str__(self):
        return f"{self.batch_name} ({self.get_species_display()}, {self.count})"


class PoultryActivityReport(models.Model):
    """General observation/health/mortality reports — applies to any species."""
    class ActivityType(models.TextChoices):
        OBSERVATION = "observation", "Observation"
        HEALTH_CONCERN = "health_concern", "Health Concern"
        MORTALITY = "mortality", "Mortality"
        HATCHING = "hatching", "Hatching"

    batch = models.ForeignKey(PoultryBatch, on_delete=models.CASCADE, related_name="activity_reports")
    report_date = models.DateField()
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    count_affected = models.PositiveIntegerField(blank=True, null=True)  # e.g. 3 died, 5 hatched
    details = models.TextField()
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="poultry_activity_reports"
    )

    class Meta:
        ordering = ["-report_date"]


class EggCollectionLog(models.Model):
    """Chicken-only: daily egg collection per laying batch."""
    batch = models.ForeignKey(PoultryBatch, on_delete=models.CASCADE, related_name="egg_logs")
    collection_date = models.DateField()
    eggs_collected = models.PositiveIntegerField()
    broken_eggs = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="egg_logs_recorded"
    )

    class Meta:
        ordering = ["-collection_date"]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.batch.species != PoultryBatch.Species.CHICKEN:
            raise ValidationError("Egg collection logs can only be recorded for chicken batches.")


class PoultryFeedLog(models.Model):
    """Chicken-only: feed consumption tracking."""
    batch = models.ForeignKey(PoultryBatch, on_delete=models.CASCADE, related_name="feed_logs")
    feed_date = models.DateField()
    feed_type = models.CharField(max_length=200)
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="poultry_feed_logs"
    )

    class Meta:
        ordering = ["-feed_date"]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.batch.species != PoultryBatch.Species.CHICKEN:
            raise ValidationError("Feed logs are currently restricted to chicken batches.")
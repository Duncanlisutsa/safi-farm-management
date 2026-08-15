from django.db import models
from django.conf import settings


class Pig(models.Model):
    class Sex(models.TextChoices):
        BOAR = "boar", "Boar"
        SOW = "sow", "Sow"
        GILT = "gilt", "Gilt"
        BARROW = "barrow", "Barrow"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        DECEASED = "deceased", "Deceased"

    tag_id = models.CharField(max_length=20, unique=True)
    breed = models.CharField(max_length=100)
    sex = models.CharField(max_length=10, choices=Sex.choices)
    dob = models.DateField(blank=True, null=True)
    acquisition_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["tag_id"]

    def __str__(self):
        return f"{self.tag_id} ({self.breed})"


class PigWeight(models.Model):
    pig = models.ForeignKey(Pig, on_delete=models.CASCADE, related_name="weights")
    weigh_date = models.DateField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="pig_weights_recorded"
    )

    class Meta:
        ordering = ["-weigh_date"]


class PigVaccination(models.Model):
    pig = models.ForeignKey(Pig, on_delete=models.CASCADE, related_name="vaccinations")
    vaccine_name = models.CharField(max_length=200)
    date_given = models.DateField()
    next_due_date = models.DateField(blank=True, null=True)
    administered_by = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        ordering = ["-date_given"]


class PigActivityReport(models.Model):
    class ActivityType(models.TextChoices):
        OBSERVATION = "observation", "Observation"
        HEALTH_CONCERN = "health_concern", "Health Concern"
        WEIGHT_RECORDED = "weight_recorded", "Weight Recorded"
        FARROWING = "farrowing", "Farrowing"
        DEATH = "death", "Death"

    pig_reference = models.CharField(max_length=50)  # specific tag_id or "All" per report spec
    report_date = models.DateField()
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    details = models.TextField()
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="pig_activity_reports"
    )

    class Meta:
        ordering = ["-report_date"]


class FeedRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        FULFILLED = "fulfilled", "Fulfilled"

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="feed_requests"
    )
    feed_type = models.CharField(max_length=200)
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    required_by_date = models.DateField(blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="feed_requests_approved"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class PigSale(models.Model):
    pig = models.ForeignKey(Pig, on_delete=models.CASCADE, related_name="sales")
    sale_date = models.DateField()
    buyer_name = models.CharField(max_length=200)
    weight_at_sale_kg = models.DecimalField(max_digits=6, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="pig_sales_recorded"
    )

    class Meta:
        ordering = ["-sale_date"]
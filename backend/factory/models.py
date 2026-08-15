from django.db import models
from django.conf import settings


class ProductionLog(models.Model):
    class ProductionLine(models.TextChoices):
        NETTLE_PROCESSING = "nettle_processing", "Stinging Nettle Processing"
        SOYA_INTAKE = "soya_intake", "Soya Bean Intake"
        DRIED_VEGETABLES = "dried_vegetables", "Dried Vegetables Production"
        SOYA_OIL_FLOUR = "soya_oil_flour", "Soya Oil & Flour Processing"

    class OutputUnit(models.TextChoices):
        KG = "kg", "Kilograms"
        LITRES = "litres", "Litres"
        UNITS = "units", "Units"

    production_line = models.CharField(max_length=30, choices=ProductionLine.choices)
    log_date = models.DateField()
    batch_number = models.CharField(max_length=50, blank=True, null=True)
    input_description = models.CharField(max_length=300, blank=True, null=True)
    input_quantity_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    output_description = models.CharField(max_length=300, blank=True, null=True)
    output_quantity = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    output_unit = models.CharField(max_length=10, choices=OutputUnit.choices, default=OutputUnit.KG)
    notes = models.TextField(blank=True, null=True)
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="production_logs"
    )

    class Meta:
        ordering = ["-log_date"]

    def __str__(self):
        return f"{self.get_production_line_display()} - {self.log_date}"


class SupplyOrder(models.Model):
    class Urgency(models.TextChoices):
        NORMAL = "normal", "Normal"
        URGENT = "urgent", "Urgent"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        FULFILLED = "fulfilled", "Fulfilled"

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="supply_orders"
    )
    item_name = models.CharField(max_length=300)
    quantity_description = models.CharField(max_length=200)
    urgency = models.CharField(max_length=10, choices=Urgency.choices, default=Urgency.NORMAL)
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="supply_orders_approved"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
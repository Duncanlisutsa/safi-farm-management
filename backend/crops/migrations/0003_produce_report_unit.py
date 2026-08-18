from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crops", "0002_crop_add_fruit_type"),
    ]

    operations = [
        migrations.RenameField(
            model_name="producereport",
            old_name="quantity_kg",
            new_name="quantity",
        ),
        migrations.AlterField(
            model_name="producereport",
            name="quantity",
            field=models.DecimalField(max_digits=10, decimal_places=2),
        ),
        migrations.AddField(
            model_name="producereport",
            name="unit",
            field=models.CharField(
                choices=[("kg", "Kilograms"), ("pieces", "Pieces (count)")],
                default="kg",
                max_length=10,
            ),
        ),
    ]
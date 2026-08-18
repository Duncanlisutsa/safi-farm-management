from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crops", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="crop",
            name="crop_type",
            field=models.CharField(
                choices=[
                    ("vegetable", "Vegetable"),
                    ("herb", "Herb"),
                    ("spice", "Spice"),
                    ("root", "Root"),
                    ("fruit", "Fruit"),
                ],
                max_length=20,
            ),
        ),
    ]
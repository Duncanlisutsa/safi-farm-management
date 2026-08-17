from django.db import migrations, models


def map_old_statuses(apps, schema_editor):
    Task = apps.get_model("planner", "Task")
    Task.objects.filter(status__in=["scheduled", "in_progress"]).update(status="pending")
    Task.objects.filter(status="done").update(status="completed")


def reverse_map_statuses(apps, schema_editor):
    Task = apps.get_model("planner", "Task")
    Task.objects.filter(status="pending").update(status="scheduled")
    Task.objects.filter(status="completed").update(status="done")


class Migration(migrations.Migration):

    dependencies = [
        ("planner", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(map_old_statuses, reverse_map_statuses),
        migrations.AlterField(
            model_name="task",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("completed", "Completed"),
                    ("carried_forward", "Carried Forward"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="task",
            name="category",
            field=models.CharField(
                choices=[
                    ("crops", "Crops"),
                    ("tea", "Tea"),
                    ("pigs", "Pigs"),
                    ("poultry", "Poultry"),
                    ("fish", "Aquaculture"),
                    ("factory", "Factory"),
                    ("general", "General"),
                ],
                max_length=20,
            ),
        ),
    ]
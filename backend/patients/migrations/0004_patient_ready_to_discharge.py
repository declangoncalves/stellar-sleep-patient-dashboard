# Generated by Django 5.2 on 2025-04-26 19:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0003_patient_last_visit'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='ready_to_discharge',
            field=models.BooleanField(default=False),
        ),
    ]

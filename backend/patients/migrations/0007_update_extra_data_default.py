from django.db import migrations, models

def update_extra_data_default(apps, schema_editor):
    Patient = apps.get_model('patients', 'Patient')
    for patient in Patient.objects.all():
        if not patient.extra_data:
            patient.extra_data = {'additional_fields': []}
            patient.save()

class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0006_isiscore'),
    ]

    operations = [
        migrations.RunPython(update_extra_data_default),
    ]

from django.db import migrations, models

def migrate_extra_data_to_additional_fields(apps, schema_editor):
    Patient = apps.get_model('patients', 'Patient')
    for patient in Patient.objects.all():
        if patient.extra_data and 'additional_fields' in patient.extra_data:
            patient.additional_fields = patient.extra_data['additional_fields']
            patient.save()

class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0010_remove_address_country'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='additional_fields',
            field=models.JSONField(default=list, blank=True),
        ),
        migrations.RunPython(migrate_extra_data_to_additional_fields),
        migrations.RemoveField(
            model_name='patient',
            name='extra_data',
        ),
    ]

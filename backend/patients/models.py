from django.db import models

class Patient(models.Model):
    first_name   = models.CharField(max_length=50)
    middle_name  = models.CharField(max_length=50, blank=True)
    last_name    = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    last_visit = models.DateField(null=True, blank=True, db_index=True)

    class Status(models.TextChoices):
        INQUIRY    = 'inquiry',    'Inquiry'
        ONBOARDING = 'onboarding', 'Onboarding'
        ACTIVE     = 'active',     'Active'
        CHURNED    = 'churned',    'Churned'

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.INQUIRY,
        db_index=True,
    )

    ready_to_discharge = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Address(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='addresses')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)  # optional second line
    city    = models.CharField(max_length=100)
    state   = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.address_line1}, {self.city}"


class ISIScore(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='isi_scores')
    score = models.IntegerField()
    date = models.DateField()

    class Meta:
        ordering = ['-date']  # Most recent scores first
        indexes = [
            models.Index(fields=['patient', 'date']),
        ]

    def __str__(self):
        return f"ISI Score: {self.score} for {self.patient} on {self.date}"

class CustomField(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class CustomFieldValue(models.Model):
    patient          = models.ForeignKey(
                          'Patient',
                          on_delete=models.CASCADE,
                          related_name='custom_field_values'
                       )
    field_definition = models.ForeignKey(
                          CustomField,
                          on_delete=models.CASCADE,
                          related_name='values'
                       )
    value = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['patient', 'field_definition'],
                name='unique_patient_custom_field'
            )
        ]

    def __str__(self):
        return f"{self.patient}: {self.field_definition.name} = {self.value}"

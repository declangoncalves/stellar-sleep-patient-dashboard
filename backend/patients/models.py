from django.db import models

class Patient(models.Model):
    first_name   = models.CharField(max_length=50)
    middle_name  = models.CharField(max_length=50, blank=True) # optional (no null, uses empty string if blank)
    last_name    = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    last_visit = models.DateField(null=True, blank=True)

    STATUS_CHOICES = [
        ('inquiry', 'Inquiry'),
        ('onboarding', 'Onboarding'),
        ('active', 'Active'),
        ('churned', 'Churned'),
    ]
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='inquiry'
    )

    ready_to_discharge = models.BooleanField(default=False)

    # JSON field for extra configurable fields per patient (flexible key-value data)
    extra_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Address(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='addresses')
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, default="")  # optional second line
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

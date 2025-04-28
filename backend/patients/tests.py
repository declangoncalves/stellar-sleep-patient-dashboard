from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Patient, Address, ISIScore, CustomField, CustomFieldValue
from datetime import date, timedelta
import json

class PatientModelTest(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1990, 1, 1),
            status=Patient.Status.ACTIVE
        )

    def test_patient_creation(self):
        """Test that a patient can be created with required fields"""
        self.assertEqual(self.patient.first_name, "John")
        self.assertEqual(self.patient.last_name, "Doe")
        self.assertEqual(self.patient.date_of_birth, date(1990, 1, 1))
        self.assertEqual(self.patient.status, Patient.Status.ACTIVE)
        self.assertFalse(self.patient.ready_to_discharge)

    def test_patient_str_representation(self):
        """Test the string representation of a patient"""
        self.assertEqual(str(self.patient), "John Doe")

    def test_patient_with_address(self):
        """Test creating a patient with an address"""
        address = Address.objects.create(
            patient=self.patient,
            address_line1="123 Main St",
            city="New York",
            state="NY",
            postal_code="10001"
        )
        self.assertEqual(address.patient, self.patient)
        self.assertEqual(str(address), "123 Main St, New York")

    def test_patient_with_isi_score(self):
        """Test creating a patient with an ISI score"""
        isi_score = ISIScore.objects.create(
            patient=self.patient,
            score=15,
            date=date.today()
        )
        self.assertEqual(isi_score.patient, self.patient)
        self.assertEqual(isi_score.score, 15)

class PatientAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient_data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "date_of_birth": "1990-01-01",
            "status": "active",
            "addresses": [
                {
                    "address_line1": "456 Oak St",
                    "city": "Los Angeles",
                    "state": "CA",
                    "postal_code": "90001"
                }
            ]
        }
        self.patient = Patient.objects.create(
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1990, 1, 1),
            status=Patient.Status.ACTIVE
        )

    def test_create_patient(self):
        """Test creating a new patient via API"""
        response = self.client.post(
            reverse('patient-list'),
            self.patient_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Patient.objects.count(), 2)
        self.assertEqual(Address.objects.count(), 1)

    def test_get_patient_list(self):
        """Test retrieving the list of patients"""
        response = self.client.get(reverse('patient-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_get_patient_detail(self):
        """Test retrieving a specific patient"""
        response = self.client.get(
            reverse('patient-detail', args=[self.patient.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], "John")

    def test_update_patient(self):
        """Test updating a patient"""
        update_data = {
            "first_name": "Johnny",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "status": "active"
        }
        response = self.client.put(
            reverse('patient-detail', args=[self.patient.id]),
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.first_name, "Johnny")

class IntegrationTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient = Patient.objects.create(
            first_name="Test",
            last_name="Patient",
            date_of_birth=date(1990, 1, 1),
            status=Patient.Status.ACTIVE
        )
        self.custom_field = CustomField.objects.create(name="Allergies")

    def test_patient_with_custom_fields(self):
        """Test creating a patient with custom fields"""
        data = {
            "first_name": "Custom",
            "last_name": "Patient",
            "date_of_birth": "1990-01-01",
            "status": "active",
            "custom_field_values": [
                {
                    "field_definition": self.custom_field.id,
                    "value": "Peanuts"
                }
            ]
        }
        response = self.client.post(
            reverse('patient-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomFieldValue.objects.count(), 1)
        custom_value = CustomFieldValue.objects.first()
        self.assertEqual(custom_value.value, "Peanuts")

    def test_patient_with_isi_scores(self):
        """Test creating a patient with ISI scores"""
        data = {
            "first_name": "ISI",
            "last_name": "Patient",
            "date_of_birth": "1990-01-01",
            "status": "active",
            "isi_scores": [
                {
                    "score": 15,
                    "date": "2024-01-01"
                },
                {
                    "score": 20,
                    "date": "2024-02-01"
                }
            ]
        }
        response = self.client.post(
            reverse('patient-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ISIScore.objects.count(), 2)
        scores = ISIScore.objects.order_by('date')
        self.assertEqual(scores[0].score, 15)
        self.assertEqual(scores[1].score, 20)

    def test_patient_filtering(self):
        """Test filtering patients by various criteria"""
        # Create a patient with specific attributes
        Patient.objects.create(
            first_name="Filter",
            last_name="Test",
            date_of_birth=date(1990, 1, 1),
            status=Patient.Status.INQUIRY,
            last_visit=date.today() - timedelta(days=30)
        )

        # Test status filter
        response = self.client.get(
            reverse('patient-list') + '?status=inquiry'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        # Test search filter
        response = self.client.get(
            reverse('patient-list') + '?search=Filter'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

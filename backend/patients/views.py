from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Patient, Address
from .serializers import PatientSerializer, AddressSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by("last_name", "first_name")
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields    = ["first_name", "last_name"]
    filterset_fields = ["status"]

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer

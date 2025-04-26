from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from .models import Patient, Address, ISIScore
from .serializers import PatientSerializer, AddressSerializer, ISIScoreSerializer

class PatientFilter(FilterSet):
    city = CharFilter(field_name='addresses__city', lookup_expr='icontains')
    state = CharFilter(field_name='addresses__state', lookup_expr='icontains')

    class Meta:
        model = Patient
        fields = ['status', 'city', 'state', 'last_visit']

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ["first_name", "last_name"]
    filterset_class = PatientFilter
    ordering_fields = ['last_name', 'first_name', 'status', 'date_of_birth', 'last_visit', 'addresses__city']
    ordering = ['last_name', 'first_name']  # default ordering

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer

class ISIScoreViewSet(viewsets.ModelViewSet):
    queryset = ISIScore.objects.all()
    serializer_class = ISIScoreSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient', 'date']
    ordering_fields = ['date', 'score']
    ordering = ['-date']  # Most recent scores first

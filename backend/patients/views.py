from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from django.db.models import Max, Subquery, OuterRef
from .models import Patient, Address, ISIScore, CustomField, CustomFieldValue
from .serializers import (
    PatientSerializer,
    AddressSerializer,
    ISIScoreSerializer,
    CustomFieldSerializer,
    CustomFieldValueSerializer
)

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
    ordering_fields = [
        'first_name', 'last_name', 'status', 'date_of_birth', 'last_visit',
        'addresses__city', 'isi_scores__score'
    ]
    ordering = ['first_name', 'last_name']  # default ordering

    def get_queryset(self):
        queryset = super().get_queryset()

        # If sorting by ISI score, use the first score (which is already the latest)
        ordering = self.request.query_params.get('ordering', '')
        if ordering in ['isi_scores__score', '-isi_scores__score']:
            # Since isi_scores are ordered by date descending,
            # we can use the first score directly
            queryset = queryset.order_by(ordering)

        # Always use distinct to avoid duplicates from joins
        return queryset.distinct()

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer

class ISIScoreViewSet(viewsets.ModelViewSet):
    queryset = ISIScore.objects.all()
    serializer_class = ISIScoreSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient', 'date']
    ordering_fields = ['date', 'score']
    # Order by date descending, then by id descending to ensure consistent ordering
    ordering = ['-date', '-id']  # Most recent scores first, then by id for same dates

class CustomFieldViewSet(viewsets.ModelViewSet):
    queryset = CustomField.objects.all()
    serializer_class = CustomFieldSerializer
    pagination_class = None  # Disable pagination for this viewset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Ensure we're returning a list
        if not isinstance(response.data, list):
            response.data = list(response.data)
        return response

class CustomFieldValueViewSet(viewsets.ModelViewSet):
    queryset = CustomFieldValue.objects.all()
    serializer_class = CustomFieldValueSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['patient', 'field_definition']

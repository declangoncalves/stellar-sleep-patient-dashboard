from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet,
    AddressViewSet,
    ISIScoreViewSet,
    CustomFieldViewSet,
    CustomFieldValueViewSet
)

router = DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patient")
router.register(r"addresses", AddressViewSet, basename="address")
router.register(r"isi-scores", ISIScoreViewSet, basename="isi-score")
router.register(r"custom-fields", CustomFieldViewSet, basename="custom-field")
router.register(r"custom-field-values", CustomFieldValueViewSet, basename="custom-field-value")

urlpatterns = [
    path("", include(router.urls)),
]

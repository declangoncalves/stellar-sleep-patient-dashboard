from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, AddressViewSet

router = DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patient")
router.register(r"addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("", include(router.urls)),
]

from rest_framework import serializers
from .models import Patient, Address

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "patient", "address_line1", "address_line2", "city", "state", "postal_code", "country"]

class PatientSerializer(serializers.ModelSerializer):
    # nest addresses on the read side
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name", "middle_name", "last_name",
            "date_of_birth", "status", "last_visit",
            "extra_data",
            "addresses",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

from rest_framework import serializers
from .models import Patient, Address, ISIScore

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "patient", "address_line1", "address_line2", "city", "state", "postal_code"]
        extra_kwargs = {
            'patient': {'required': False}
        }

class ISIScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ISIScore
        fields = ["id", "patient", "score", "date"]
        extra_kwargs = {
            'patient': {'required': False}
        }

class PatientSerializer(serializers.ModelSerializer):
    # nest addresses and ISI scores
    addresses = AddressSerializer(many=True, required=False)
    isi_scores = ISIScoreSerializer(many=True, required=False)

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name", "middle_name", "last_name",
            "date_of_birth", "status", "last_visit",
            "extra_data",
            "addresses",
            "created_at", "updated_at",
            "ready_to_discharge",
            "isi_scores",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        addresses_data = validated_data.pop('addresses', [])
        isi_scores_data = validated_data.pop('isi_scores', [])
        patient = super().create(validated_data)

        # Create addresses
        for address_data in addresses_data:
            Address.objects.create(patient=patient, **address_data)

        # Create ISI scores
        for score_data in isi_scores_data:
            ISIScore.objects.create(patient=patient, **score_data)

        return patient

    def update(self, instance, validated_data):
        addresses_data = validated_data.pop('addresses', [])
        isi_scores_data = validated_data.pop('isi_scores', [])
        patient = super().update(instance, validated_data)

        # Update addresses
        patient.addresses.all().delete()
        for address_data in addresses_data:
            Address.objects.create(patient=patient, **address_data)

        # Update ISI scores
        patient.isi_scores.all().delete()
        for score_data in isi_scores_data:
            ISIScore.objects.create(patient=patient, **score_data)

        return patient

    def to_representation(self, instance):
        """Convert the instance to a representation that includes nested data."""
        representation = super().to_representation(instance)
        representation['addresses'] = AddressSerializer(instance.addresses.all(), many=True).data
        representation['isi_scores'] = ISIScoreSerializer(instance.isi_scores.all(), many=True).data
        return representation

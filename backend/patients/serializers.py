# serializers.py

from django.db import transaction
from rest_framework import serializers
from .models import Patient, Address, ISIScore

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "address_line1", "address_line2", "city", "state", "postal_code"]

class ISIScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ISIScore
        fields = ["id", "score", "date"]

class PatientSerializer(serializers.ModelSerializer):
    addresses   = AddressSerializer(many=True, required=False)
    isi_scores  = ISIScoreSerializer(many=True, required=False)

    class Meta:
        model = Patient
        fields = [
            "id", "first_name", "middle_name", "last_name",
            "date_of_birth", "status", "last_visit",
            "additional_fields", "ready_to_discharge",
            "addresses", "isi_scores",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    @transaction.atomic
    def create(self, validated_data):
        addresses  = validated_data.pop("addresses", [])
        isi_scores = validated_data.pop("isi_scores", [])
        patient = Patient.objects.create(**validated_data)

        # bulk create is a small performance win if you have many items
        Address.objects.bulk_create([
            Address(patient=patient, **addr) for addr in addresses
        ])
        ISIScore.objects.bulk_create([
            ISIScore(patient=patient, **score) for score in isi_scores
        ])

        return patient

    @transaction.atomic
    def update(self, instance, validated_data):
        # Pop but default to None so we can tell “not provided” vs. “provided empty list”
        addresses  = validated_data.pop("addresses", None)
        isi_scores = validated_data.pop("isi_scores", None)

        # update flat fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if addresses is not None:
            instance.addresses.all().delete()
            Address.objects.bulk_create([
                Address(patient=instance, **addr) for addr in addresses
            ])

        if isi_scores is not None:
            instance.isi_scores.all().delete()
            ISIScore.objects.bulk_create([
                ISIScore(patient=instance, **score) for score in isi_scores
            ])

        return instance

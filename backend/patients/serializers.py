# serializers.py

from django.db import transaction
from rest_framework import serializers
from .models import Patient, Address, ISIScore, CustomField, CustomFieldValue


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
        ]


class ISIScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ISIScore
        fields = ["id", "score", "date"]


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = ["id", "name"]


class CustomFieldValueSerializer(serializers.ModelSerializer):
    # Use primary key for writes; nested read via CustomFieldSerializer
    field_definition = serializers.PrimaryKeyRelatedField(
        queryset=CustomField.objects.all()
    )

    class Meta:
        model = CustomFieldValue
        fields = ["id", "field_definition", "value"]


class PatientSerializer(serializers.ModelSerializer):
    addresses           = AddressSerializer(many=True, required=False)
    isi_scores          = ISIScoreSerializer(many=True, required=False)
    custom_field_values = CustomFieldValueSerializer(many=True, required=False)

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "middle_name",
            "last_name",
            "date_of_birth",
            "status",
            "last_visit",
            "ready_to_discharge",
            "addresses",
            "isi_scores",
            "custom_field_values",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    @transaction.atomic
    def create(self, validated_data):
        addresses       = validated_data.pop("addresses", [])
        isi_scores      = validated_data.pop("isi_scores", [])
        custom_values   = validated_data.pop("custom_field_values", [])

        # Create patient
        patient = Patient.objects.create(**validated_data)

        # Create related entries individually
        for addr in addresses:
            Address.objects.create(patient=patient, **addr)
        for score in isi_scores:
            ISIScore.objects.create(patient=patient, **score)
        for val in custom_values:
            CustomFieldValue.objects.create(
                patient=patient,
                field_definition=val['field_definition'],
                value=val.get('value', '')
            )

        return patient

    @transaction.atomic
    def update(self, instance, validated_data):
        addresses       = validated_data.pop("addresses", None)
        isi_scores      = validated_data.pop("isi_scores", None)
        custom_values   = validated_data.pop("custom_field_values", None)

        # Update flat fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace related entries if provided
        if addresses is not None:
            instance.addresses.all().delete()
            for addr in addresses:
                Address.objects.create(patient=instance, **addr)

        if isi_scores is not None:
            instance.isi_scores.all().delete()
            for score in isi_scores:
                ISIScore.objects.create(patient=instance, **score)

        if custom_values is not None:
            try:
                instance.custom_field_values.all().delete()
                for val in custom_values:
                    # Ensure field_definition is properly extracted
                    field_def = val.get('field_definition')
                    if not field_def:
                        continue

                    # Create the custom field value
                    CustomFieldValue.objects.create(
                        patient=instance,
                        field_definition=field_def,
                        value=val.get('value', '')
                    )
            except Exception as e:
                print(f"Error processing custom fields: {e}")
                print(f"Custom values data: {custom_values}")
                raise

        return instance

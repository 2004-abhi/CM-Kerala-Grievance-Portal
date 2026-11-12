
from rest_framework import serializers
from .models import Grievance


class GrievanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Grievance

        fields = [
            'id',
            'reference_number',
            'district',
            'category',
            'subject',
            'description',
            'priority',
            'status',
            'attachment',
            'created_at'
        ]

        read_only_fields = [
            'id',
            'reference_number',
            'priority',
            'status',
            'created_at'
        ]


from .models import Assignment, Department
from django.contrib.auth import get_user_model

User = get_user_model()


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = [
            'id',
            'grievance',
            'department',
            'officer',
            'remarks',
            'assigned_at'
        ]
        read_only_fields = ['id', 'assigned_at']

    def validate(self, data):
        officer = data.get('officer')

        if officer:
            if officer.role != 'OFFICER':
                raise serializers.ValidationError(
                    "Selected user must have the OFFICER role."
                )

        return data

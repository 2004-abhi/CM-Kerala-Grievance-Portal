
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

User = get_user_model()

from .serializers import RegisterSerializer


class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response({
                "message": "Registration successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "mobile": user.mobile,
                    "role": user.role
                }
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

# Get currently logged-in user details
class CurrentUserView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "mobile": request.user.mobile,
            "role": request.user.role
        })
# Get all department officers (CMO only)
class OfficerListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Only CMO administrators can view officers
        if request.user.role != 'CMO_ADMIN':
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        officers = User.objects.filter(role='OFFICER')

        officer_data = [
            {
                "id": officer.id,
                "username": officer.username,
                "email": officer.email
            }
            for officer in officers
        ]

        return Response({
            "total_officers": len(officer_data),
            "officers": officer_data
        })    
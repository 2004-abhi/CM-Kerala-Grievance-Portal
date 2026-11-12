
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone

from .models import (
    Department,
    Grievance,
    GrievanceHistory,
    Assignment,
    ResolutionReport,
    Feedback
)

from .serializers import (
    GrievanceSerializer,
    AssignmentSerializer
)


# Display all departments
class DepartmentListView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        departments = Department.objects.all()

        department_data = []

        for department in departments:
            department_data.append({
                "id": department.id,
                "name": department.name,
                "description": department.description
            })

        return Response(
            department_data,
            status=status.HTTP_200_OK
        )


# Submit a new grievance
class GrievanceCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = GrievanceSerializer(data=request.data)

        if serializer.is_valid():

            grievance = serializer.save(
                citizen=request.user
            )

            GrievanceHistory.objects.create(
                grievance=grievance,
                changed_by=request.user,
                old_status='',
                new_status='SUBMITTED',
                remarks='Grievance submitted by citizen.'
            )

            return Response({
                "message": "Grievance submitted successfully",
                "reference_number": grievance.reference_number,
                "status": grievance.status,
                "priority": grievance.priority
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
class MyGrievancesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        grievances = Grievance.objects.filter(
            citizen=request.user
        ).order_by('-created_at')

        serializer = GrievanceSerializer(
            grievances,
            many=True
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    
    # CMO Dashboard - View all grievances
class AllGrievancesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'CMO_ADMIN':
            return Response(
                {"error": "Access denied. CMO administrators only."},
                status=status.HTTP_403_FORBIDDEN
            )

        grievances = Grievance.objects.all().order_by('-created_at')

        serializer = GrievanceSerializer(grievances, many=True)

        return Response({
            "total_grievances": grievances.count(),
            "grievances": serializer.data
        }, status=status.HTTP_200_OK)

# CMO - Assign grievance to a department and officer
class GrievanceAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only CMO administrators can assign grievances
        if request.user.role != 'CMO_ADMIN':
            return Response(
                {"error": "Only CMO administrators can assign grievances."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AssignmentSerializer(data=request.data)

        if serializer.is_valid():

            # Get validated assignment details
            grievance = serializer.validated_data['grievance']
            department = serializer.validated_data['department']
            officer = serializer.validated_data['officer']

            # Check whether this exact assignment already exists
            existing_assignment = Assignment.objects.filter(
                grievance=grievance,
                department=department,
                officer=officer
            ).exists()

            if existing_assignment:
                return Response(
                    {
                        "error": "This grievance is already assigned to this officer and department."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save the new assignment
            assignment = serializer.save()

            # Update grievance department and status
            old_status = grievance.status
            grievance.department = assignment.department
            grievance.status = 'UNDER_REVIEW'
            grievance.save()

            # Record status change
            GrievanceHistory.objects.create(
                grievance=grievance,
                changed_by=request.user,
                old_status=old_status,
                new_status='UNDER_REVIEW',
                remarks=assignment.remarks or 'Grievance assigned by CMO.'
            )

            return Response({
                "message": "Grievance assigned successfully.",
                "reference_number": grievance.reference_number,
                "department": assignment.department.name,
                "officer": assignment.officer.username if assignment.officer else None,
                "status": grievance.status
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# Officer Dashboard - View assigned grievances
class OfficerGrievancesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Only department officers can access this API
        if request.user.role != 'OFFICER':
            return Response(
                {"error": "Only department officers can access this page."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get unique grievances assigned to the logged-in officer
        grievances = Grievance.objects.filter(
            assignments__officer=request.user
        ).distinct().order_by('-created_at')

        # Convert grievances into JSON
        serializer = GrievanceSerializer(
            grievances,
            many=True
        )

        return Response({
            "total_assigned": grievances.count(),
            "grievances": serializer.data
        }, status=status.HTTP_200_OK)

# Officer - Submit resolution report for CMO approval
class OfficerGrievanceUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, grievance_id):

        # Only officers can submit reports
        if request.user.role != 'OFFICER':
            return Response(
                {"error": "Only officers can submit resolution reports."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check whether this grievance is assigned to this officer
        assignment = Assignment.objects.filter(
            grievance_id=grievance_id,
            officer=request.user
        ).first()

        if not assignment:
            return Response(
                {"error": "This grievance is not assigned to you."},
                status=status.HTTP_404_NOT_FOUND
            )

        grievance = assignment.grievance

        # Prevent reports for already resolved grievances
        if grievance.status == 'RESOLVED':
            return Response(
                {"error": "This grievance is already resolved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the action taken report
        report_text = request.data.get('report', '').strip()

        if not report_text:
            return Response(
                {"error": "Please provide an action taken report."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save the report for CMO review
        resolution_report = ResolutionReport.objects.create(
            grievance=grievance,
            officer=request.user,
            report=report_text
        )

        # Change status to IN_PROGRESS if necessary
        old_status = grievance.status

        if grievance.status != 'IN_PROGRESS':

            grievance.status = 'IN_PROGRESS'
            grievance.save()

            # Record status history
            GrievanceHistory.objects.create(
                grievance=grievance,
                changed_by=request.user,
                old_status=old_status,
                new_status='IN_PROGRESS',
                remarks="Officer submitted a resolution report for CMO review."
            )

        return Response({
            "message": "Resolution report submitted successfully. Waiting for CMO approval.",
            "reference_number": grievance.reference_number,
            "report_id": resolution_report.id,
            "review_status": resolution_report.review_status,
            "grievance_status": grievance.status
        }, status=status.HTTP_201_CREATED)


# CMO - Review officer resolution reports
class CMOResolutionReviewView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):

        # Only CMO administrators can review reports
        if request.user.role != 'CMO_ADMIN':
            return Response(
                {"error": "Only CMO administrators can review reports."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Find the resolution report
        resolution_report = ResolutionReport.objects.filter(
            id=report_id
        ).first()

        if not resolution_report:
            return Response(
                {"error": "Resolution report not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only pending reports can be reviewed
        if resolution_report.review_status != 'PENDING':
            return Response(
                {"error": "This report has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get CMO decision and remarks
        decision = request.data.get('decision', '').upper()
        cmo_remarks = request.data.get('cmo_remarks', '').strip()

        if decision not in ['APPROVED', 'REJECTED']:
            return Response(
                {"error": "Decision must be APPROVED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if decision == 'REJECTED' and not cmo_remarks:
            return Response(
                {"error": "Please provide remarks when rejecting a report."},
                status=status.HTTP_400_BAD_REQUEST
            )

        grievance = resolution_report.grievance

        # Save CMO review details
        resolution_report.review_status = decision
        resolution_report.cmo_remarks = cmo_remarks
        resolution_report.reviewed_by = request.user
        resolution_report.reviewed_at = timezone.now()
        resolution_report.save()

        old_status = grievance.status

        # Approve: mark grievance as resolved
        if decision == 'APPROVED':

            grievance.status = 'RESOLVED'
            grievance.save()

            GrievanceHistory.objects.create(
                grievance=grievance,
                changed_by=request.user,
                old_status=old_status,
                new_status='RESOLVED',
                remarks="CMO approved the officer's resolution report."
            )

            message = "Resolution report approved. Grievance marked as resolved."

        # Reject: keep grievance in progress
        else:
            message = "Resolution report rejected. Grievance remains in progress."

        return Response({
            "message": message,
            "reference_number": grievance.reference_number,
            "decision": resolution_report.review_status,
            "grievance_status": grievance.status,
            "cmo_remarks": resolution_report.cmo_remarks
        }, status=status.HTTP_200_OK)



# Citizen - Submit feedback after grievance resolution
class CitizenFeedbackView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, grievance_id):

        # Find the grievance submitted by this citizen
        grievance = Grievance.objects.filter(
            id=grievance_id,
            citizen=request.user
        ).first()

        if not grievance:
            return Response(
                {"error": "Grievance not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Feedback is allowed only for resolved grievances
        if grievance.status != 'RESOLVED':
            return Response(
                {"error": "You can submit feedback only after resolution."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent duplicate feedback
        if Feedback.objects.filter(grievance=grievance).exists():
            return Response(
                {"error": "Feedback has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get rating and comments
        rating = request.data.get('rating')
        comments = request.data.get('comments', '').strip()

        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return Response(
                {"error": "Rating must be a number between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if rating < 1 or rating > 5:
            return Response(
                {"error": "Rating must be between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save citizen feedback
        feedback = Feedback.objects.create(
            grievance=grievance,
            citizen=request.user,
            rating=rating,
            comments=comments
        )

        return Response({
            "message": "Feedback submitted successfully.",
            "reference_number": grievance.reference_number,
            "rating": feedback.rating,
            "comments": feedback.comments
        }, status=status.HTTP_201_CREATED)

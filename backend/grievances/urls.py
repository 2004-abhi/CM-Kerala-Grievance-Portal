
from django.urls import path

from .views import (
    DepartmentListView,
    GrievanceCreateView,
    MyGrievancesView,
    AllGrievancesView,
    GrievanceAssignmentView,
    OfficerGrievancesView,
    OfficerGrievanceUpdateView,
    CMOResolutionReviewView,
    CitizenFeedbackView,
)
urlpatterns = [
    path('departments/', DepartmentListView.as_view(), name='department-list'),

    path('grievances/', GrievanceCreateView.as_view(), name='grievance-create'),

    path('my-grievances/', MyGrievancesView.as_view(), name='my-grievances'),

    path('cmo/grievances/', AllGrievancesView.as_view(), name='cmo-grievances'),

    path('cmo/assign/', GrievanceAssignmentView.as_view(), name='grievance-assignment'),

    # Officer dashboard
    path('officer/grievances/', OfficerGrievancesView.as_view(), name='officer-grievances'),

    # Officer updates a particular grievance
    path('officer/grievances/<int:grievance_id>/update/', OfficerGrievanceUpdateView.as_view(), name='officer-grievance-update'),

    path(
    'cmo/reports/<int:report_id>/review/',
    CMOResolutionReviewView.as_view(),
    name='cmo-resolution-review'
    ),
    path(
    'grievances/<int:grievance_id>/feedback/',
    CitizenFeedbackView.as_view(),
    name='citizen-feedback'
    ),

]

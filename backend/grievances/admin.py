
from django.contrib import admin
from .models import (
    Department,
    Grievance,
    GrievanceHistory,
    Assignment,
    Feedback,
    ResolutionReport
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)


@admin.register(Grievance)
class GrievanceAdmin(admin.ModelAdmin):
    list_display = (
        'reference_number',
        'citizen',
        'district',
        'category',
        'priority',
        'status',
        'created_at'
    )

    list_filter = ('status', 'priority', 'category', 'district')
    search_fields = (
        'reference_number',
        'subject',
        'citizen__username',
        'citizen__email'
    )

    readonly_fields = ('reference_number', 'created_at', 'updated_at')


@admin.register(GrievanceHistory)
class GrievanceHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'grievance',
        'old_status',
        'new_status',
        'changed_by',
        'changed_at'
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        'grievance',
        'department',
        'officer',
        'assigned_at'
    )


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = (
        'grievance',
        'citizen',
        'rating',
        'submitted_at'
    )
@admin.register(ResolutionReport)
class ResolutionReportAdmin(admin.ModelAdmin):
    list_display = (
        'grievance',
        'officer',
        'review_status',
        'submitted_at'
    )
    list_filter = ('review_status',)
    search_fields = ('grievance__reference_number', 'officer__username')
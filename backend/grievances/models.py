
import uuid
from django.db import models
from django.conf import settings


class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Grievance(models.Model):

    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),
        ('UNDER_REVIEW', 'Under Review'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('REOPENED', 'Reopened'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    CATEGORY_CHOICES = [
        ('HEALTH', 'Health'),
        ('EDUCATION', 'Education'),
        ('PWD', 'Public Works'),
        ('WATER', 'Water Supply'),
        ('ELECTRICITY', 'Electricity'),
        ('OTHER', 'Other'),
    ]

    reference_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='grievances'
    )

    district = models.CharField(max_length=100)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    subject = models.CharField(max_length=200)
    description = models.TextField()

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='SUBMITTED'
    )

    attachment = models.FileField(
        upload_to='grievances/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = (
                'CMK-' + uuid.uuid4().hex[:10].upper()
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.reference_number


class GrievanceHistory(models.Model):

    grievance = models.ForeignKey(
        Grievance,
        on_delete=models.CASCADE,
        related_name='history'
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)

    remarks = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.grievance.reference_number} - {self.new_status}"


class Assignment(models.Model):

    grievance = models.ForeignKey(
        Grievance,
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE
    )

    officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_grievances'
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    def __str__(self):
        return self.grievance.reference_number


class Feedback(models.Model):

    grievance = models.OneToOneField(
        Grievance,
        on_delete=models.CASCADE,
        related_name='feedback'
    )

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    rating = models.PositiveSmallIntegerField()
    comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.grievance.reference_number}"



class ResolutionReport(models.Model):

    REVIEW_CHOICES = [
        ('PENDING', 'Pending CMO Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    grievance = models.ForeignKey(
        Grievance,
        on_delete=models.CASCADE,
        related_name='resolution_reports'
    )

    officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_resolution_reports'
    )

    report = models.TextField()

    review_status = models.CharField(
        max_length=20,
        choices=REVIEW_CHOICES,
        default='PENDING'
    )

    cmo_remarks = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_resolution_reports'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Resolution report - {self.grievance.reference_number}"

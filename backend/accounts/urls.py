from django.urls import path
from .views import RegisterView, CurrentUserView, OfficerListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('officers/', OfficerListView.as_view(), name='officer-list'),
]

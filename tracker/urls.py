from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import DashboardAPIView, FoodLogCreateView, ActivityLogCreateView, WaterLogCreateView, BodyMetricCreateView, \
    UserRegistrationView, ProfileUpdateView, FoodLogDetailView, ActivityLogDetailView, WaterLogDetailView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='api-register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('auth/', include('rest_framework.urls')),

    path('dashboard/', DashboardAPIView.as_view(), name='api-dashboard'),
    path('profile/', ProfileUpdateView.as_view(), name='api-profile'),

    path('food/', FoodLogCreateView.as_view(), name='api-add-food'),
    path('activity/', ActivityLogCreateView.as_view(), name='api-add-activity'),
    path('water/', WaterLogCreateView.as_view(), name='api-add-water'),
    path('weight/', BodyMetricCreateView.as_view(), name='api-add-weight'),

    path('food/<int:pk>/', FoodLogDetailView.as_view(), name='api-detail-food'),
    path('activity/<int:pk>/', ActivityLogDetailView.as_view(), name='api-detail-activity'),
    path('water/<int:pk>/', WaterLogDetailView.as_view(), name='api-detail-water'),
]

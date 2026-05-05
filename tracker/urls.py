from django.urls import path
from .views import DashboardAPIView, FoodLogCreateView, ActivityLogCreateView, WaterLogCreateView, BodyMetricCreateView

urlpatterns = [
    path('dashboard/', DashboardAPIView.as_view(), name='api-dashboard'),

    path('food/add/', FoodLogCreateView.as_view(), name='api-add-food'),
    path('activity/add/', ActivityLogCreateView.as_view(), name='api-add-activity'),
    path('water/add/', WaterLogCreateView.as_view(), name='api-add-water'),
    path('weight/add/', BodyMetricCreateView.as_view(), name='api-add-weight'),
]
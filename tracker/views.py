from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView
from django.db.models import Sum
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile, BodyMetricLog, FoodLog, ActivityLog, WaterLog
from .serializers import (
    ProfileSerializer, BodyMetricSerializer, FoodLogSerializer,
    ActivityLogSerializer, WaterLogSerializer, BodyMetricCreateSerializer,
    UserRegistrationSerializer
)


def custom_logout(request):
    logout(request)
    return redirect('/login/')


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        profile = Profile.objects.get(user=user)
        profile_data = ProfileSerializer(profile).data

        weight_logs = BodyMetricLog.objects.filter(user=user).order_by('date')[:30]
        weight_data = BodyMetricSerializer(weight_logs, many=True).data

        food_today = FoodLog.objects.filter(user=user, date=today).aggregate(
            total_cal=Sum('calories'),
            total_p=Sum('protein'),
            total_f=Sum('fats'),
            total_c=Sum('carbs')
        )
        consumed_calories = food_today['total_cal'] or 0
        consumed_protein = food_today['total_p'] or 0
        consumed_fat = food_today['total_f'] or 0
        consumed_carbs = food_today['total_c'] or 0

        water_today = WaterLog.objects.filter(user=user, date=today).aggregate(total_water=Sum('amount_ml'))
        consumed_water = water_today['total_water'] or 0

        activity_today = ActivityLog.objects.filter(user=user, date=today).aggregate(
            total_burn=Sum('calories_burned'),
            total_duration=Sum('duration_minutes')
        )
        burned_calories = activity_today['total_burn'] or 0
        duration_minutes = activity_today['total_duration'] or 0

        food_logs_today = FoodLog.objects.filter(user=user, date=today)
        water_logs_today = WaterLog.objects.filter(user=user, date=today)
        activity_logs_today = ActivityLog.objects.filter(user=user, date=today)

        food_data_today = FoodLogSerializer(food_logs_today, many=True).data
        water_data_today = WaterLogSerializer(water_logs_today, many=True).data
        activity_data_today = ActivityLogSerializer(activity_logs_today, many=True).data

        # Розрахунок цілей
        base_calories = profile.daily_calorie_goal
        base_carbs = profile.daily_carbs_goal
        base_water = profile.daily_water_goal

        adjusted_calories = base_calories + burned_calories
        earned_carbs = int(burned_calories / 4)
        adjusted_carbs = base_carbs + earned_carbs

        earned_water = int((duration_minutes / 60.0) * 500)
        adjusted_water = base_water + earned_water

        return Response({
            "profile": profile_data,
            "charts": {
                "weight_history": weight_data
            },
            "today_summary": {
                "consumed_calories": consumed_calories,
                "consumed_protein": consumed_protein,
                "consumed_fat": consumed_fat,
                "consumed_carbs": consumed_carbs,
                "burned_calories": burned_calories,
                "active_minutes": duration_minutes,
                "net_calories": consumed_calories - burned_calories,
                "consumed_water": consumed_water
            },
            "dynamic_goals_today": {
                "target_calories": adjusted_calories,
                "target_protein": profile.daily_protein_goal,
                "target_fat": profile.daily_fat_goal,
                "target_carbs": adjusted_carbs,
                "target_water": adjusted_water,
                "earned_extra_carbs": earned_carbs,
                "earned_extra_water": earned_water
            },
            "logs_today": {
                "food": food_data_today,
                "water": water_data_today,
                "activity": activity_data_today
            }
        })


class FoodLogCreateView(generics.CreateAPIView):
    serializer_class = FoodLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ActivityLogCreateView(generics.CreateAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WaterLogCreateView(generics.CreateAPIView):
    serializer_class = WaterLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BodyMetricCreateView(generics.CreateAPIView):
    serializer_class = BodyMetricCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Виправлено на timezone.localdate!
        log_date = request.data.get('date', timezone.localdate().isoformat())

        instance = BodyMetricLog.objects.filter(user=request.user, date=log_date).first()

        if instance:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FoodLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodLog.objects.filter(user=self.request.user)


class ActivityLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user)


class WaterLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WaterLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WaterLog.objects.filter(user=self.request.user)


class CustomLoginView(LoginView):
    template_name = 'login.html'

    def get_success_url(self):
        user = self.request.user

        if hasattr(user, 'profile') and user.profile.is_complete:
            return '/'

        return '/profile/'

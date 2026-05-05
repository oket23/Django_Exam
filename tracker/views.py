from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum

from .models import Profile, BodyMetricLog, FoodLog, ActivityLog, WaterLog
from .serializers import ProfileSerializer, BodyMetricSerializer

class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        profile = Profile.objects.get(user=user)
        profile_data = ProfileSerializer(profile).data

        weight_logs = BodyMetricLog.objects.filter(user=user).order_by('date')[:30]
        weight_data = BodyMetricSerializer(weight_logs, many=True).data

        food_today = FoodLog.objects.filter(user=user, date=today).aggregate(total_cal=Sum('calories'))
        consumed_calories = food_today['total_cal'] or 0

        water_today = WaterLog.objects.filter(user=user, date=today).aggregate(total_water=Sum('amount_ml'))
        consumed_water = water_today['total_water'] or 0

        activity_today = ActivityLog.objects.filter(user=user, date=today).aggregate(
            total_burn=Sum('calories_burned'),
            total_duration=Sum('duration_minutes')
        )
        burned_calories = activity_today['total_burn'] or 0
        duration_minutes = activity_today['total_duration'] or 0

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
            }
        })
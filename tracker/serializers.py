from rest_framework import serializers
from .models import Profile, BodyMetricLog, FoodLog, ActivityLog

class BodyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMetricLog
        fields = ['date', 'weight', 'body_fat']


class ProfileSerializer(serializers.ModelSerializer):
    current_weight = serializers.ReadOnlyField()
    daily_water_goal = serializers.ReadOnlyField()
    daily_calorie_goal = serializers.ReadOnlyField()

    daily_protein_goal = serializers.ReadOnlyField()
    daily_fat_goal = serializers.ReadOnlyField()
    daily_carbs_goal = serializers.ReadOnlyField()

    class Meta:
        model = Profile
        fields = [
            'height', 'target_weight', 'goal', 'current_weight',
            'daily_water_goal', 'daily_calorie_goal',
            'daily_protein_goal', 'daily_fat_goal', 'daily_carbs_goal'
        ]
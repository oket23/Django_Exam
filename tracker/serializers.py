from rest_framework import serializers
from .models import Profile, BodyMetricLog, ActivityLog, FoodLog, WaterLog

class FoodLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodLog
        fields = ['id', 'date', 'meal_name', 'calories', 'protein', 'fats', 'carbs']

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'date', 'activity_type', 'duration_minutes', 'calories_burned']
        read_only_fields = ['calories_burned']

class WaterLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterLog
        fields = ['id', 'date', 'amount_ml']

class BodyMetricCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMetricLog
        fields = ['id', 'date', 'weight', 'body_fat']

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
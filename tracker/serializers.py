from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Profile, BodyMetricLog, FoodLog, ActivityLog, WaterLog


class BodyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMetricLog
        fields = ['date', 'weight', 'body_fat']


class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)

    current_weight = serializers.ReadOnlyField()
    daily_water_goal = serializers.ReadOnlyField()
    daily_calorie_goal = serializers.ReadOnlyField()
    daily_protein_goal = serializers.ReadOnlyField()
    daily_fat_goal = serializers.ReadOnlyField()
    daily_carbs_goal = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    is_complete = serializers.ReadOnlyField()

    class Meta:
        model = Profile
        fields = [
            'first_name', 'last_name', 'gender', 'birth_date', 'height',
            'target_weight', 'goal', 'activity_level', 'age', 'current_weight',
            'daily_water_goal', 'daily_calorie_goal',
            'daily_protein_goal', 'daily_fat_goal', 'daily_carbs_goal',
            'is_complete'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        user.save()

        return super().update(instance, validated_data)

    def validate(self, data):
        goal = data.get('goal', self.instance.goal)
        target = data.get('target_weight', self.instance.target_weight)
        current = self.instance.current_weight

        height = data.get('height', self.instance.height if self.instance else None)
        if height:
            height_float = float(height)
            if height_float < 50 or height_float > 300:
                raise serializers.ValidationError({
                    "height": "Введіть реальний зріст (від 50 до 300 см)."
                })

        if target and current:
            current = float(current)
            target = float(target)

            if goal == 'cut' and target >= current:
                raise serializers.ValidationError(
                    {"target_weight": "При схудненні цільова вага має бути меншою за поточну."})
            elif goal == 'bulk' and target <= current:
                raise serializers.ValidationError(
                    {"target_weight": "При наборі маси цільова вага має бути більшою за поточну."})
            elif goal == 'maintain' and target != current:
                raise serializers.ValidationError(
                    {"target_weight": "При підтримці цільова вага має дорівнювати поточній."})

        return data


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


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

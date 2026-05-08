from django.contrib import admin

from .models import Profile, BodyMetricLog, FoodLog, ActivityLog, WaterLog


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'target_weight', 'goal')
    list_filter = ('goal',)

@admin.register(BodyMetricLog)
class BodyMetricLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'weight', 'body_fat')
    list_filter = ('date', 'user')

@admin.register(FoodLog)
class FoodLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'meal_name', 'calories')
    list_filter = ('date', 'user')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'activity_type', 'duration_minutes', 'calories_burned')
    list_filter = ('activity_type', 'date')

@admin.register(WaterLog)
class WaterLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'amount_ml')
    list_filter = ('date',)
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class Profile(models.Model):
    GOAL_CHOICES = [
        ('cut', 'Схуднення'),
        ('maintain', 'Підтримка'),
        ('bulk', 'Набір маси'),
    ]

    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', 'Сидячий (без спорту)'),
        ('light', 'Легка (1-3 тренування)'),
        ('moderate', 'Середня (3-5 тренувань)'),
        ('active', 'Висока (щодня)'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Зріст у см")
    target_weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    goal = models.CharField(max_length=10, choices=GOAL_CHOICES, default='maintain')
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVEL_CHOICES, default='light')

    @property
    def current_weight(self):
        latest_log = self.user.body_metrics.order_by('-date').first()
        if latest_log:
            return latest_log.weight
        return None

    @property
    def daily_water_goal(self):
        if self.current_weight:
            return int(float(self.current_weight) * 35)
        return 2000

    @property
    def daily_calorie_goal(self):
        if not self.current_weight:
            return 2000

        multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725
        }
        multiplier = multipliers.get(self.activity_level, 1.375)

        bmr = float(self.current_weight) * 24

        tdee = bmr * multiplier

        if self.goal == 'cut':
            return int(tdee - 500)
        elif self.goal == 'bulk':
            return int(tdee + 500)

        return int(tdee)

    @property
    def daily_protein_goal(self):
        if self.current_weight:
            return int(float(self.current_weight) * 1.8)
        return 0

    @property
    def daily_fat_goal(self):
        if self.current_weight:
            return int(float(self.current_weight) * 1.0)
        return 0

    @property
    def daily_carbs_goal(self):
        if not self.current_weight or not self.daily_calorie_goal:
            return 0

        protein_cals = self.daily_protein_goal * 4
        fat_cals = self.daily_fat_goal * 9

        remaining_cals = self.daily_calorie_goal - (protein_cals + fat_cals)

        if remaining_cals > 0:
            return int(remaining_cals / 4)
        return 0

    def __str__(self):
        return f"Профіль: {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


class BodyMetricLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_metrics')
    date = models.DateField(default=timezone.now)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text="Вага в кг")
    body_fat = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text="Відсоток жиру (%)")

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.weight}кг"


class FoodLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='food_logs')
    date = models.DateField(default=timezone.now)
    meal_name = models.CharField(max_length=100, help_text="Наприклад: Сніданок, Обід або куряче філе")
    calories = models.PositiveIntegerField()
    protein = models.PositiveIntegerField(default=0)
    fats = models.PositiveIntegerField(default=0)
    carbs = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.meal_name} ({self.calories} ккал) - {self.date}"


class ActivityLog(models.Model):
    ACTIVITY_CHOICES = [
        ('gym', 'Тренажерний зал (Силове)'),
        ('streetball', 'Стрітбол/Баскетбол'),
        ('cardio', 'Кардіо (Біг/Велосипед)'),
        ('other', 'Інша активність (Ходьба)'),
    ]

    MET_VALUES = {
        'gym': 3.5,
        'streetball': 6.5,
        'cardio': 7.0,
        'other': 3.0,
    }

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    date = models.DateField(default=timezone.now)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_CHOICES)
    duration_minutes = models.PositiveIntegerField(help_text="Тривалість у хвилинах")

    calories_burned = models.PositiveIntegerField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.calories_burned:
            weight = self.user.profile.current_weight
            if not weight:
                weight = 70.0

            met = self.MET_VALUES.get(self.activity_type, 3.0)

            duration_hours = self.duration_minutes / 60.0

            self.calories_burned = int(met * float(weight) * duration_hours)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_activity_type_display()} - {self.duration_minutes} хв ({self.calories_burned} ккал)"


class WaterLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_logs')
    date = models.DateField(default=timezone.now)
    amount_ml = models.PositiveIntegerField(help_text="Кількість води в мл")

    def __str__(self):
        return f"{self.amount_ml} мл - {self.date}"
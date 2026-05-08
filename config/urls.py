from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView
from tracker.views import custom_logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tracker.urls')),

    path('', TemplateView.as_view(template_name='dashboard.html'), name='home'),
    path('profile/', TemplateView.as_view(template_name='profile_setup.html'), name='profile-setup'),
    path('register/', TemplateView.as_view(template_name='register.html'), name='register'),
    path('login/', LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', custom_logout, name='logout'),
]
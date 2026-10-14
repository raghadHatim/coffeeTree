from django.urls import include, path
from . import views

urlpatterns = [
    path('', views.orders_view , name='orders'),
    path('checkout', views.checkout_view , name='checkout')
]
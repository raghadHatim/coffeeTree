from django.contrib import messages
from django.contrib.auth import login
from django.shortcuts import redirect, render

from cart.models import Cart
from .forms import RegisterForm


def register(request):
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            Cart.objects.get_or_create(user=user)  # نسوي له سلة عشان موديل Cart مربوط بالمستخدم
            login(request, user)
            messages.success(request, "Welcome to Coffee Tree!")
            return redirect("home")
    else:
        form = RegisterForm()

    return render(request, "accounts/register.html", {"form": form})
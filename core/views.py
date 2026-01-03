from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages


def login_view(request):
    """Handle user login."""
    if request.user.is_authenticated:
        return redirect("dashboard:dashboard")

    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return redirect("dashboard:dashboard")
        else:
            messages.error(request, "Invalid email or password")

    return render(request, "auth/login.html")


def logout_view(request):
    """Handle user logout."""
    logout(request)
    return redirect("core:login")


@login_required
def profile_view(request):
    """Display user profile."""
    return render(request, "auth/profile.html", {"user": request.user})

from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def settings_view(request):
    """Settings page view."""
    context = {
        "user": request.user,
    }

    return render(request, "settings/settings.html", context)

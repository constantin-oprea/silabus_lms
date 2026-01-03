from django.contrib.auth import login
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class AutoLoginMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only run if we are strictly on the Laptop (Localhost)
        host = request.get_host().split(":")[0]
        if host == "localhost" or host == "127.0.0.1":
            if not request.user.is_authenticated:
                # Find the first Superuser (Admin) in the database
                user = User.objects.filter(is_superuser=True).first()
                if user:
                    # Log them in instantly without a password
                    login(
                        request,
                        user,
                        backend="django.contrib.auth.backends.ModelBackend",
                    )

        response = self.get_response(request)
        return response

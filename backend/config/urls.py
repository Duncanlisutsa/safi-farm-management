from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("planner.urls")),
    path("api/", include("crops.urls")),
    path("api/", include("tea.urls")),
    path("api/", include("pigs.urls")),
    path("api/", include("aquaculture.urls")),
    path("api/", include("factory.urls")),
    path("api/", include("reports.urls")),
    path("api/", include("core.urls")),
    path("api/", include("poultry.urls")),
]

from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
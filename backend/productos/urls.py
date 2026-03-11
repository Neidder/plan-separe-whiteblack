from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, KardexViewSet

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'kardex', KardexViewSet)
urlpatterns = router.urls
from rest_framework.routers import DefaultRouter
from .views import PlanSepareViewSet, EntregaViewSet

router = DefaultRouter()
router.register(r'planes', PlanSepareViewSet)
router.register(r'entregas', EntregaViewSet)

urlpatterns = router.urls
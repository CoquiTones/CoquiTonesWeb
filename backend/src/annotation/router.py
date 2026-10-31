# Re-export the annotation router so the service module can depend on the
# repository layer without importing this module (avoids circular imports).
from annotation.service import router

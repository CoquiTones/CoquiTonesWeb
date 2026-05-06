# This module exists only to re-export the router from the other module to achieve the required structure.
# If the router was initialized in this module, it would be impossible to have the service module import this file
# and for this file to import the service module (which is necessary for the path operations to be initialized)
# without a circular dependency (unless the import is made conditional, which is bad practice).
from audio.service import router
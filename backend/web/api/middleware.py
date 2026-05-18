import json
import time
from django.utils.deprecation import MiddlewareMixin
from api.models import AuditLog


class AuditLogMiddleware(MiddlewareMixin):
    """Middleware to log all API requests and responses to the AuditLog model."""

    def process_request(self, request):
        """Store the start time of the request."""
        request._start_time = time.time()
        request._request_body = self._get_request_body(request)
        return None

    def process_response(self, request, response):
        """Log the request/response after the response is created."""
        # Only log API requests
        if not request.path.startswith("/api/"):
            return response

        # Skip logging for documentation and audit log endpoints
        if request.path in ["/api/schema/", "/api/docs/", "/api/redoc/", "/api/admin/audit-logs/"]:
            return response

        try:
            # Get authenticated user
            user = request.user if request.user.is_authenticated else None

            # Calculate response time
            start_time = getattr(request, "_start_time", time.time())
            response_time_ms = int((time.time() - start_time) * 1000)

            # Get query parameters
            query_params = dict(request.GET)

            # Get request body
            request_body = getattr(request, "_request_body", None)

            # Extract error message if status is 4xx or 5xx
            error_message = None
            if response.status_code >= 400:
                try:
                    if response.get("Content-Type", "").startswith("application/json"):
                        error_data = json.loads(response.content.decode("utf-8"))
                        if isinstance(error_data, dict):
                            # Try to extract meaningful error message
                            error_message = str(
                                error_data.get("detail") or error_data.get("error") or error_data
                            )[:500]
                except Exception:
                    pass

            # Create audit log entry
            AuditLog.objects.create(
                user=user,
                method=request.method,
                path=request.path,
                query_params=query_params,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                request_body=request_body,
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                error_message=error_message,
            )
        except Exception as e:
            # Don't break the response if logging fails
            print(f"Error logging audit: {str(e)}")

        return response

    def _get_request_body(self, request):
        """Extract request body (for POST/PATCH/PUT)."""
        if request.method not in ["POST", "PUT", "PATCH"]:
            return None

        try:
            if request.content_type == "application/json":
                return json.loads(request.body.decode("utf-8"))
        except Exception:
            pass

        return None

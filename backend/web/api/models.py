from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "api_user"

    def __str__(self):
        return self.username


class Supplier(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "suppliers"

    def __str__(self):
        return self.name


class Bolt(models.Model):
    supplier = models.ForeignKey(
        Supplier, on_delete=models.PROTECT, related_name="bolts", db_index=True
    )
    name = models.CharField(max_length=255)
    length = models.FloatField(db_index=True)
    diameter = models.FloatField()
    category = models.CharField(max_length=255, db_index=True)
    equipment_compatibility = models.JSONField(
        default=list,
        help_text="List of equipment names e.g. ['Handheld', 'Boltec', 'Multi-OEM']",
    )
    is_published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bolts"
        indexes = [
            models.Index(
                fields=["supplier", "category", "is_published"],
                name="bolt_sup_cat_pub_idx",
            ),
        ]

    def clean(self):
        if not self.equipment_compatibility:
            raise ValidationError(
                {"equipment_compatibility": "At least one equipment type is required."}
            )
        if not isinstance(self.equipment_compatibility, list):
            raise ValidationError({"equipment_compatibility": "Must be a list of equipment names."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Test(models.Model):
    class Methodology(models.TextChoices):
        STATIC = "static", "Static"
        DYNAMIC = "dynamic", "Dynamic"

    # required fields
    bolt = models.ForeignKey(Bolt, on_delete=models.PROTECT, related_name="tests", db_index=True)
    methodology = models.CharField(max_length=10, choices=Methodology.choices, db_index=True)
    facility = models.CharField(max_length=255, db_index=True)

    # optional shared fields
    installation_method = models.CharField(max_length=255, null=True, blank=True)
    encapsulation_method = models.CharField(max_length=255, null=True, blank=True)
    peak_strength = models.FloatField(null=True, blank=True)
    bond_strength = models.FloatField(null=True, blank=True)
    yield_strength = models.FloatField(null=True, blank=True)
    ultimate_deformation = models.FloatField(null=True, blank=True)
    stiffness = models.FloatField(null=True, blank=True)

    # static-only
    loading_rate = models.FloatField(null=True, blank=True, help_text="Required for static tests")

    # dynamic-only
    energy_absorption = models.FloatField(
        null=True, blank=True, help_text="Required for dynamic tests"
    )
    number_of_drops = models.PositiveIntegerField(
        null=True, blank=True, help_text="Required for dynamic tests"
    )

    is_published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tests"
        indexes = [
            models.Index(fields=["bolt", "is_published"], name="test_bolt_published_idx"),
            models.Index(fields=["facility", "is_published"], name="test_facility_published_idx"),
            models.Index(
                fields=["methodology", "is_published"],
                name="test_methodology_published_idx",
            ),
        ]

    def clean(self):
        if self.methodology == self.Methodology.STATIC:
            errors = {}
            if self.energy_absorption is not None:
                errors["energy_absorption"] = "Energy absorption is not applicable to static tests."
            if self.number_of_drops is not None:
                errors["number_of_drops"] = "Number of drops is not applicable to static tests."
            if errors:
                raise ValidationError(errors)

        if self.methodology == self.Methodology.DYNAMIC:
            errors = {}
            if self.loading_rate is not None:
                errors["loading_rate"] = "Loading rate is not applicable to dynamic tests."
            if errors:
                raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Test {self.id} ({self.methodology}) — {self.bolt.name}"


class TestCurve(models.Model):
    test = models.OneToOneField(
        Test,
        on_delete=models.CASCADE,
        related_name="curve",
        db_index=True,
        null=True,
        blank=True,
    )
    curve_pair = models.JSONField(
        default=list,
        help_text=(
            "List of data points, each with displacement (mm), load (kN), "
            "and energy_absorbed (kJ). Null values are allowed where data "
            "was not recorded. "
            "e.g. [{'displacement': 0.5, 'load': 186.86, 'energy_absorbed': 0.093}, ...]"
        ),
    )
    is_published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "test_curves"

    def __str__(self):
        return f"Curve — Test {self.test.id}"


class AuditLog(models.Model):
    """Audit log for tracking API requests and responses."""

    HTTP_METHODS = [
        ("GET", "GET"),
        ("POST", "POST"),
        ("PUT", "PUT"),
        ("PATCH", "PATCH"),
        ("DELETE", "DELETE"),
        ("HEAD", "HEAD"),
        ("OPTIONS", "OPTIONS"),
    ]

    # Request info
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    method = models.CharField(max_length=10, choices=HTTP_METHODS)
    path = models.CharField(max_length=500)
    query_params = models.JSONField(default=dict, blank=True)

    # Response info
    status_code = models.IntegerField()
    response_time_ms = models.IntegerField()  # milliseconds

    # Request body (for POST/PATCH)
    request_body = models.JSONField(null=True, blank=True)

    # Additional context
    user_agent = models.CharField(max_length=500, blank=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["-timestamp"], name="audit_timestamp_idx"),
            models.Index(fields=["user", "-timestamp"], name="audit_user_timestamp_idx"),
            models.Index(fields=["path", "-timestamp"], name="audit_path_timestamp_idx"),
        ]

    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code}"

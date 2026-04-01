from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Supplier, Bolt, Test, TestCurve

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username", "email", "role",
        "department", "phone", "is_active"
    )
    list_filter = ("role", "is_active", "department")
    search_fields = ("username", "email", "phone")

    fieldsets = UserAdmin.fieldsets + (
        ("Additional Information", {
            "fields": ("role", "phone", "department", "position")
        }),
    )

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)

@admin.register(Bolt)
class BoltAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "supplier", "category", "length", "diameter", "is_published")
    list_filter = ("supplier", "category", "is_published")
    search_fields = ("name", "supplier__name")

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ("id", "bolt", "methodology", "facility", "peak_strength", "is_published")
    list_filter = ("methodology", "is_published", "facility")
    search_fields = ("bolt__name", "facility")

@admin.register(TestCurve)
class TestCurveAdmin(admin.ModelAdmin):
    list_display = ("id", "test", "is_published")

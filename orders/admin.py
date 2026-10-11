from django.contrib import admin
from .models import ShippingCompany, Order, OrderItem


@admin.register(ShippingCompany)
class ShippingCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'delivery_days')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'created_at')
    list_editable = ('status',)
    list_filter = ('status',)


admin.site.register(OrderItem)
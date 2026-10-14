from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from cart.models import Cart
from .models import Order, OrderItem, ShippingCompany

def orders_view(request):
    if not request.user.is_authenticated:
       return redirect('login')
    
    user = request.user 
    orders=[]
    if user:
    # Descending order from newest to oldest
       orders = Order.objects.filter(user=user).order_by('-created_at')
    context = {
        'orders': orders,
    }
    return render(request,'my_orders.html' , context)


def checkout_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    user = request.user 
   
    if  not user:
        return redirect('cart')
    cart, created = Cart.objects.get_or_create(user=user)
    cart_items = cart.items.all()
    total_price = sum(item.product.price * item.quantity for item in cart_items)

    shipping_companies = ShippingCompany.objects.all()

    # take the values ​​entered by the user
    if request.method== 'POST':
        full_name = request.POST.get('fullname')
        phone = request.POST.get('phone')
        city = request.POST.get('city')
        address = request.POST.get('address')
        shipping_company_id = request.POST.get('shipping')

        try:
         shipping_comp = ShippingCompany.objects.get(id=shipping_company_id)
         shipping_cost = shipping_comp.price
        except ShippingCompany.DoesNotExist:
         shipping_comp = shipping_companies.first()
         shipping_cost = shipping_comp.price if shipping_comp else 15.00

        final_total = total_price + shipping_cost

        # Create and save a request
        order = Order.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            city=city,
            address=address,
            shipping_company=shipping_comp,
            shipping_cost=shipping_cost,
            total_price=final_total,
            status='pending'
        )

        # Save cart items to the order
        for cart_item in cart_items:
         OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            price=cart_item.product.price
        )

        # Emptying the cart after order completion and redirecting to the orders page
        cart.items.all().delete()
        return redirect('orders')

    context = {
        'cart_items': cart_items,
        'total_price': total_price,
        'shipping_companies': shipping_companies,
    }
    return render(request, 'Checkout.html', context)

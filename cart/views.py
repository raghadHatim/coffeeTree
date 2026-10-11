from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from cart.models import Cart,CartItem
from django.http import JsonResponse
from django.contrib.auth.models import User
from products.models import Product
from django.shortcuts import get_object_or_404, redirect

# @login_required
def cart_view(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_items = cart.items.all()
    total_price = sum(item.product.price * item.quantity for item in cart_items)

    total_items_count = sum(item.quantity for item in cart_items)
    context = {
        'cart_items': cart_items,
        'total_price': total_price,
        'total_items_count': total_items_count,
    }
    return render(request, 'cart.html' , context)

# add item into cart
def add_to_cart(request, product_id):
    user = request.user if request.user.is_authenticated else User.objects.first()

    if user:
        cart, created = Cart.objects.get_or_create(user=user)
        product = get_object_or_404(Product, id=product_id)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            cart_item.quantity += 1
            cart_item.save()

        total_items_count = sum(item.quantity for item in cart.items.all())
        return JsonResponse({
            'status': 'success', 
            'message': 'Added to cart successfully!',
            'cart_count': total_items_count  
        })

    return JsonResponse({'status': 'error', 'message': 'User not found'})

# remove item from cart
def remove_from_cart(request, product_id):
    user = request.user if request.user.is_authenticated else User.objects.first()

    if user:
        cart = Cart.objects.filter(user=user).first()
        if cart:
            CartItem.objects.filter(cart=cart, product_id=product_id).delete()
            
            total_items_count = sum(item.quantity for item in cart.items.all())
            
            return JsonResponse({
                'status': 'success',
                'cart_count': total_items_count
            })
            
    return JsonResponse({'status': 'error'})
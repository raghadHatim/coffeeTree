# coffeeTree
An online store for coffee beans, brewing tools and coffee mugs, built with Django as a training project.
Customers can browse the shop, add products to a cart, check out with a shipping company of their choice and track their order status. 
Store owners manage everything from the Django admin panel.

## Features
Home page with an introduction to the store.
Shop page with products grouped by category (whole beans, coffee tools, coffee mugs).
Sign in / log out with Django authentication.
Cart for signed-in users. Guests who try to add a product see a pop-up asking them to sign in.
Checkout: customer details (name, phone, city, address), shipping company selection and an automatic total (subtotal + shipping).
Orders are saved with the price at the time of purchase, and the cart is emptied after confirmation.
"My Orders" page with order number, date, total and status.
Admin panel to manage products, categories, shipping companies and order statuses.

## 🛠️ Tech Stack

| Area | Technology |
| :--- | :--- |
| **Language** | Python |
| **Framework** | Django |
| **Database** | SQLite |
| **Frontend** | HTML, CSS, JavaScript |
| **Fonts** | Google Fonts |
| **Version Control** | Git, GitHub |

## 🗄️ Database Design

| Table | Purpose |
| :--- | :--- |
| `User` | Django built-in users |
| `Category` | Product categories |
| `Product` | Store products |
| `Cart` | One cart per user |
| `CartItem` | Products inside a cart, with quantity |
| `ShippingCompany` | Shipping options with price and delivery days |
| `Order` | A confirmed order with customer details and total |
| `OrderItem` | Products inside an order, with the price at purchase time |

## 🚀 Getting Started

Follow these steps to run the project locally:
# 1. Clone the repository
git clone https://github.com/raghadHatim/coffeeTree.git
cd coffeeTree

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate            # macOS / Linux: source venv/bin/activate

# 3. Install the requirements
pip install -r requirements.txt

# 4. Create the database tables
python manage.py migrate

# 5. Create an admin account
python manage.py createsuperuser

# 6. Run the server
python manage.py runserver

Open http://127.0.0.1:8000/ for the store and http://127.0.0.1:8000/admin/ for the admin panel.

## 👥 Team

| Developer | GitHub |
| :--- | :--- |
| **[Samar Alsaidi]** | [@samar-uqu](https://github.com/samar-uqu) | 
| **[Raghad Hatim]** | [@raghadHatim](https://github.com/raghadHatim) |

Design and build a complete mobile-first food/tiffin ordering app called **TiffinBuddy** for **Ahmedabad, Gujarat**.

The app connects customers with reliable local tiffin/home-food sellers. The core experience should be **simple, minimal, trustworthy, homely and healthy**.

Use the **TiffinBuddy logo already provided in this conversation** as the primary brand identity. Do not redesign or replace the logo. Build the entire UI around its existing visual language.

## CORE PRODUCT IDEA

TiffinBuddy is not a typical restaurant-delivery app.

It is a **daily home-food and tiffin service** where customers can:

* Order today's meal
* Choose lunch or dinner
* Select vegetarian/home-style meals
* Build their own plate
* Choose healthy meal options
* Select portion preferences
* Skip or pause meals
* Order one-time meals
* Subscribe to recurring tiffin plans
* Choose delivery location
* Track their order
* Rate the meal and seller

Tiffin sellers should also have a simple seller-side experience to manage:

* Today's menu
* Available quantity
* Orders
* Delivery status
* Customer preferences
* Pause/unavailable status
* Earnings/order summary

Do NOT design the app like a cluttered Zomato/Swiggy clone.

The UX should prioritize **daily repeat ordering, trust, clarity and speed**.

---

# DESIGN DIRECTION

Create a **minimal modern Indian food app**.

Visual personality:

* Homely
* Healthy
* Warm
* Fresh
* Reliable
* Friendly
* Clean
* Premium but affordable

Use generous whitespace and strong visual hierarchy.

Avoid:

* Excessive banners
* Too many promotional cards
* Excessive gradients
* Overloaded home screens
* Unnecessary animations
* Excessive categories
* Dark/heavy UI
* Complicated navigation

Use subtle **glassmorphism only where it improves hierarchy**, not everywhere.

Use soft cards, rounded corners, subtle shadows and clean spacing.

---

# COLOR SYSTEM

Create a cohesive food-focused palette based on the existing TiffinBuddy logo.

Use:

* Primary brand color from the logo
* Warm off-white / cream background
* Soft neutral surfaces
* Dark charcoal text
* One healthy green accent for healthy/vegetarian indicators
* Very limited secondary accent colors

Maintain strong WCAG-readable text contrast.

Do not use too many colors.

---

# TYPOGRAPHY

Use a modern, highly readable sans-serif font.

Suggested:

**Inter / Manrope / DM Sans**

Typography hierarchy:

* Large bold page titles
* Medium section headings
* Clear body text
* Small supporting metadata
* Strong but compact CTA labels

Keep typography simple and consistent throughout the product.

---

# INFORMATION ARCHITECTURE

Use a simple bottom navigation with:

1. **Home**
2. **Explore**
3. **Orders**
4. **Plans**
5. **Profile**

Keep navigation consistent across the app.

---

# CUSTOMER EXPERIENCE

## 1. SPLASH SCREEN

Minimal screen.

Show:

TiffinBuddy logo

Tagline:

**Your daily dabba, sorted.**

Small supporting line:

**Homely food. Healthy choices. Delivered daily.**

Do not overload the splash screen.

---

# 2. ONBOARDING

Create 2–3 simple onboarding screens explaining:

**Homely meals**
Fresh, everyday food from trusted local tiffin sellers.

**Choose your plate**
Build your meal according to your taste and needs.

**Reliable daily delivery**
Know your meal, seller and delivery status clearly.

Use simple food illustrations or photography.

---

# 3. LOCATION / ADDRESS

After onboarding, allow the user to select their delivery location.

Header:

**Where should we deliver?**

Show:

* Current location
* Saved addresses
* Home
* Office
* Add new address

Use Ahmedabad-specific context.

Example:

**Ahmedabad**

Allow locality selection such as:

* Navrangpura
* Vastrapur
* Satellite
* Bopal
* Prahlad Nagar
* Maninagar
* Chandkheda
* SG Highway

Do not assume every seller delivers everywhere.

Clearly show:

**Available in your area**

or

**Not available in this area yet**

---

# 4. HOME SCREEN

Make this the most important screen.

Top:

**Good afternoon, [Name]**

Location selector:

**Home • Ahmedabad**

Then a compact primary section:

### Today's Tiffin

Show today's recommended meal with:

* Food image
* Seller name
* Rating
* Delivery estimate
* Vegetarian indicator
* Price
* **Order Now** CTA

Example:

**Ghar Jaisa Tiffin**

Dal • Roti • Sabzi • Rice • Salad

₹120

**Order Now**

Then:

### Choose what you need

Use minimal horizontal cards:

**Today's Meal**
**Build Your Plate**
**Healthy Meals**
**Weekly Plans**

Then:

### Popular near you

Show a small list of trusted tiffin sellers.

Each card should display:

* Seller name
* Rating
* Cuisine/home-food type
* Distance
* Delivery time
* Starting price
* Veg indicator
* Availability

Avoid huge restaurant cards.

---

# 5. EXPLORE

Create a clean discovery screen.

Search bar:

**Search meals, dishes or tiffin sellers**

Filters:

* Veg
* Healthy
* Jain
* Low Oil
* High Protein
* Budget
* Delivery time
* Rating

Categories:

**Home Food**
**Gujarati**
**North Indian**
**Healthy**
**Jain**
**Light Meals**

Use compact chips rather than large colorful category cards.

---

# 6. TIFFIN SELLER PROFILE

Create a trustworthy seller detail page.

Show:

Seller name

Rating + number of reviews

**Verified Tiffin Partner**

Delivery area

Delivery timing

Kitchen hygiene information

Then:

### Today's Menu

Display individual dishes clearly.

Example:

Dal Tadka
₹40

Rotli
₹10

Mix Veg Sabzi
₹40

Jeera Rice
₹35

Salad
₹20

Allow the seller to mark:

**Available**
**Sold Out**

---

# 7. BUILD YOUR PLATE

This is a key differentiating feature.

Use the heading:

**Build Your Plate**

Supporting copy:

**Pick what you want. Skip what you don't.**

Create a step-by-step customization flow.

### Step 1 — Choose your base

* Rotli
* Paratha
* Rice
* Khichdi
* No Base

### Step 2 — Choose sabzi

Allow quantity selection.

### Step 3 — Choose dal / protein

### Step 4 — Add sides

* Salad
* Chaas
* Pickle
* Papad
* Curd

### Step 5 — Preferences

* Less oil
* Less spicy
* No onion
* No garlic
* Jain
* Extra protein

Show a live summary at the bottom:

**Your Plate**

Dal + 3 Rotli + Sabzi + Salad

₹110

**Add to Cart**

Make customization extremely easy and visually understandable.

---

# 8. HEALTHY MEALS

Create a dedicated healthy-food section.

Heading:

**Eat Well, Feel Well**

Categories:

**Low Oil**
**High Protein**
**Balanced Meal**
**Light Dinner**
**Jain**
**Calorie Conscious**

Each meal should communicate WHY it is healthy.

Example:

**Protein Power Tiffin**

Dal + Paneer + 3 Rotli + Salad

**High Protein**

₹150

Avoid making unsupported medical or nutritional claims.

---

# 9. MEAL DETAIL

Create a clean meal-detail screen.

Include:

Large food image

Meal name

Seller

Rating

Price

Ingredients

What's included

Dietary information

Preparation information

Available delivery slots

Customization

Quantity selector

Primary CTA:

**Add to Cart**

Secondary action:

**Order for later**

---

# 10. CART

Keep the cart extremely simple.

Header:

**Your Tiffin**

Show:

Seller

Selected meal

Customization summary

Quantity

Price

Delivery fee

Total

Delivery address

Delivery time

CTA:

**Proceed to Checkout**

Also allow:

**Add another item**

Avoid unnecessary upselling.

---

# 11. CHECKOUT

Use a clean one-page checkout.

Sections:

**Deliver to**

Home • Ahmedabad

**Your Meal**

Meal summary

**Delivery time**

Today • 1:00–1:30 PM

**Payment**

UPI
Card
Cash on Delivery

Show:

Subtotal

Delivery fee

Total

Primary CTA:

**Place Order**

Add clear order confirmation before payment.

---

# 12. ORDER CONFIRMATION

Show:

**Tiffin's on the way!**

Order number

Seller name

Meal

Delivery address

Expected delivery time

Then show progress:

**Order placed**
→ **Preparing**
→ **Picked up**
→ **Out for delivery**
→ **Delivered**

Use clear status communication.

---

# 13. ORDER TRACKING

Create a simple tracking screen.

Show:

* Current status
* Estimated arrival
* Seller
* Delivery partner
* Order summary
* Contact/help

Do not overload with a complicated map.

Use a map only when it genuinely improves tracking.

---

# 14. ORDERS

Create tabs:

**Active**
**Past**

Each order card should show:

Date

Meal

Seller

Amount

Status

CTA:

**Track Order**

For completed orders:

**Reorder**

---

# 15. TIFFIN PLANS

This is important for repeat customers.

Create:

**Tiffin Plans**

Options:

**Weekly**
5 meals

**Monthly**
20 meals

Allow customers to choose:

* Lunch
* Dinner
* Both
* Vegetarian
* Jain
* Healthy

Allow:

**Pause Plan**
**Skip a Day**
**Change Meal**
**Change Address**

Do not force subscriptions.

One-time ordering must remain easy.

---

# 16. PROFILE

Include:

* Personal information
* Saved addresses
* Food preferences
* Dietary preferences
* Payment methods
* Tiffin plans
* Order history
* Notifications
* Help & support

Create a dedicated:

**My Preferences**

where users can save:

* Vegetarian
* Jain
* Less spicy
* Less oil
* No onion
* No garlic
* Preferred portion

These preferences should automatically influence recommendations and customization.

---

# SELLER EXPERIENCE

Create a separate **Tiffin Seller Dashboard**.

The seller interface should be even simpler than the customer interface.

Seller home:

**Good morning, [Seller Name]**

Today's overview:

**12 Orders**
**3 Preparing**
**7 Ready**
**2 Delivered**

Then:

### Today's Menu

Allow seller to:

* Add dish
* Edit price
* Set availability
* Mark sold out
* Change quantity
* Add meal image

### Orders

Each order should show:

Customer

Meal

Customization

Delivery time

Status

Example:

**Order #1042**

2 Tiffins

Less spicy

No onion

1:00 PM

Buttons:

**Accept**
**Preparing**
**Ready**

---

# SELLER RELIABILITY FEATURES

Build trust on both sides.

Include:

**Verified Seller**

**Kitchen hygiene information**

**Order acceptance status**

**Available / Unavailable**

**Daily capacity**

**Sold-out status**

**Preparation time**

**Customer preferences**

**Order history**

Prevent sellers from accepting more orders than their available capacity.

Show clear warnings:

**Today's capacity almost full**

**Only 5 meals remaining**

---

# CUSTOMER TRUST FEATURES

Show subtle trust indicators:

**Verified Tiffin Partner**

**Hygiene checked**

**Reliable delivery**

**4.8 ★ from 120 customers**

**98% orders delivered on time**

Only show performance statistics when real data exists.

Never fabricate trust metrics.

---

# UX PRINCIPLES

Design around these principles:

### 1. One primary action per screen

### 2. Minimum cognitive load

### 3. Repeat ordering should take seconds

### 4. Customization should be visual and easy

### 5. Food information should be scannable

### 6. Delivery status should always be clear

### 7. Seller availability must be transparent

### 8. Customer preferences should persist

### 9. Never hide important fees

### 10. Avoid unnecessary promotional clutter

---

# COMPONENT SYSTEM

Create reusable Figma components and variants for:

* Buttons
* Primary CTA
* Secondary CTA
* Food cards
* Seller cards
* Meal cards
* Category chips
* Filter chips
* Rating
* Dietary badges
* Quantity selector
* Add button
* Navigation bar
* Search bar
* Input fields
* Address cards
* Order status
* Progress tracker
* Bottom sheets
* Modals
* Toast notifications
* Empty states
* Loading states
* Error states
* Sold-out states

Create component variants for:

Default / Pressed / Disabled / Loading / Selected.

---

# RESPONSIVE DESIGN

Design primarily for mobile.

Use a **390 × 844 px** mobile frame as the primary design size.

Maintain an 8px spacing system.

Use:

* 16–20px horizontal page padding
* 12–16px card spacing
* Large touch targets
* Minimum 44px interactive areas

Also create responsive layouts for larger mobile screens.

---

# UX STATES

Do not design only the happy path.

Include:

* Loading
* Empty cart
* No meals available
* Seller unavailable
* Meal sold out
* Location outside service area
* Payment failed
* Order cancelled
* Network error
* Subscription paused
* No active orders

Each state should have clear recovery actions.

---

# MICROCOPY

Keep language friendly and simple.

Examples:

**Your daily dabba, sorted.**

**What's cooking today?**

**Build Your Plate**

**Pick what you want. Skip what you don't.**

**Made fresh for you.**

**Homely food, without the hassle.**

**Your tiffin is being prepared.**

**Delivered with care.**

Avoid excessive marketing language.

---

# FINAL DESIGN REQUIREMENT

The final product should look like a **real, production-ready Ahmedabad tiffin marketplace**, not a generic food-delivery UI concept.

Prioritize:

**Minimal UI**

* **Strong UX**
* **Home-style food**
* **Healthy choices**
* **Personalization**
* **Reliable ordering**
* **Transparent delivery**
* **Seller reliability**

The customer should be able to complete a repeat meal order in **as few steps as reasonably possible**.

The seller should be able to manage their daily menu and orders without needing technical knowledge.

Create the complete clickable prototype with realistic sample Ahmedabad tiffin sellers, meals, prices, addresses and order states.

Use the existing TiffinBuddy logo consistently throughout the experience.

Do not add unnecessary features just to make the app look bigger. Every screen and component must have a clear UX purpose.

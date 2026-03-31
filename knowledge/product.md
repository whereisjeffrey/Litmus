# E-Commerce Product Page Best Practices

## Overview
The product page is where the purchase decision is made. It must answer every question a buyer has — what is this product, is it right for me, can I trust this seller, and how do I buy it? Success means a high add-to-cart rate and low return rate (indicating the page accurately set expectations). The average e-commerce product page converts 2-5% of visitors to add-to-cart. Top performers exceed 10%.

## Rules

### Product Images: Multiple Angles (3-5 Minimum)
- **What to check:** The product has at least 3-5 images showing different angles, details, and context. Single-image products are flagged.
- **Why it matters:** 75% of online shoppers rely on product photos when deciding on a purchase (Justuno). Products with 3+ images have 2x the add-to-cart rate of single-image products (Shopify data).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Include: front view, back view, side/detail view, scale/size reference, and in-context/lifestyle shot. For clothing: front, back, detail, and on-model.

### Product Images: Zoom Capability
- **What to check:** Users can zoom into product images to see fine details. Hover-to-zoom, click-to-enlarge, or pinch-to-zoom on mobile should be available.
- **Why it matters:** 35% of product returns happen because the product "looked different than expected" (Narvar). Zoom lets users inspect quality, texture, and details before purchase.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Implement hover-to-zoom on desktop (magnifier or enlarged preview). Support pinch-to-zoom on mobile. Ensure source images are high-resolution enough (2000px+ on longest side).

### Product Images: Lifestyle or Context Images
- **What to check:** At least one image shows the product in use, in its intended environment, or being worn/held by a person for scale.
- **Why it matters:** Context images help buyers visualize ownership. They increase conversion by 22-30% (BigCommerce). They also reduce returns by setting accurate size/scale expectations.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Include at least one lifestyle image. For furniture: in a room setting. For clothing: on a model. For electronics: being used. For food: plated and served.

### Product Images: Video if Applicable
- **What to check:** For products where motion, functionality, or fit matter, a product video or 360-degree view is available.
- **Why it matters:** Product pages with video convert 80% higher than those without (Animoto). Video is especially effective for apparel (fit), electronics (functionality), and complex products.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add a 15-60 second product video showing the product in use. Include it in the image gallery. Auto-play muted on desktop, click-to-play on mobile. Support 360-degree views where feasible.

### Product Images: Alt Text on All Images
- **What to check:** Every product image has descriptive alt text that conveys what the image shows, including product name and context.
- **Why it matters:** Required for WCAG accessibility. Also critical for Google Image Search SEO. Alt text helps screen reader users understand product visuals.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Write descriptive alt text: "Blue denim jacket, front view" not "product-img-3.jpg." Include the product name. Describe the angle, color, and any unique detail shown.

### Purchase Decision: Price Prominent and Clear
- **What to check:** The product price is large, clear, and visible near the product title without scrolling. Sale prices show the original price struck through.
- **Why it matters:** Price is the #1 factor in purchase decisions. If users can't immediately find the price, 40% leave (Baymard). Unclear pricing creates distrust.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Display the price in a large font (20-24px+) near the product title. For sale items, show original price with strikethrough and the sale price in a contrasting color. Include the currency symbol.

### Purchase Decision: Add to Cart Button Above the Fold
- **What to check:** The "Add to Cart" button is visible without scrolling on both desktop and mobile viewports.
- **Why it matters:** If users have to scroll to find the buy button, conversion drops significantly. The add-to-cart button should be as prominent as the price.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Place the "Add to Cart" button above the fold near the price. On mobile, consider a sticky add-to-cart bar at the bottom. Use a high-contrast color. Make it at least 48px tall.

### Purchase Decision: Stock Availability Shown
- **What to check:** Stock status is visible near the add-to-cart button: "In Stock", "Only 3 left", "Out of Stock", or expected restock date.
- **Why it matters:** Availability information reduces purchase anxiety and prevents the frustration of adding to cart only to find the item is unavailable at checkout. Low-stock indicators create urgency.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show stock status near the buy button. Use green for "In Stock", amber for "Low Stock (3 left)", red for "Out of Stock." For out-of-stock items, show "Notify me when available."

### Purchase Decision: Shipping Information Visible
- **What to check:** Shipping cost, estimated delivery date, or a link to shipping info is visible on the product page (not only at checkout).
- **Why it matters:** 48% of cart abandonment is due to unexpected shipping costs (Baymard). Showing shipping info on the product page prevents this surprise.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Show "Free Shipping" if applicable. Show estimated delivery ("Get it by Friday") based on location. At minimum, link to shipping rates page. For free-shipping thresholds, show progress.

### Purchase Decision: Size/Variant Selector Intuitive
- **What to check:** If the product has variants (size, color, material), the selector is clear, easy to use, and shows availability per variant. Out-of-stock variants are visually indicated.
- **Why it matters:** Poor variant selectors cause frustration and abandonment. Clicking a size only to see "Out of Stock" after selection is a top UX complaint in e-commerce.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Show all variants upfront (not in a dropdown for fewer than 7 options). Cross out or gray out unavailable variants. Update the product image when a color variant is selected. For sizing, include a size guide link.

### Purchase Decision: Size Guide Available
- **What to check:** For products with sizing (clothing, shoes, furniture), a size guide with measurements is accessible from the product page.
- **Why it matters:** Size-related returns account for 40% of all apparel returns (Narvar). A clear size guide reduces returns by 20-30%. It also increases purchase confidence.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a "Size Guide" link near the size selector. Open it in a modal (not a new page). Include measurements in both metric and imperial. Add a body measurement guide.

### Purchase Decision: Quantity Selector Present
- **What to check:** A quantity selector allows users to add more than one item at a time. It defaults to 1 and prevents negative or zero values.
- **Why it matters:** Hiding the quantity selector forces users to add items one at a time, increasing friction and reducing order value.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Show a quantity input with +/- buttons near the Add to Cart button. Default to 1. Set a reasonable max based on stock. Prevent non-numeric input.

### Trust: Reviews and Ratings Displayed
- **What to check:** Customer reviews and a star rating are displayed on the product page. The review section is below the product details.
- **Why it matters:** 93% of consumers say reviews impact their purchase decision (Podium). Products with reviews convert 270% more than those without (Spiegel Research Center).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Display aggregate star rating near the product title. Show individual reviews below product details. Include a "Write a Review" CTA. Show verified purchase badges.

### Trust: Review Count Shown (Not Just Stars)
- **What to check:** The aggregate review score shows the count of reviews (e.g., "4.5 stars (237 reviews)"), not just the star rating.
- **Why it matters:** A 5-star rating from 2 reviews is less convincing than a 4.3-star rating from 500 reviews. Review count provides credibility context.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Display format: "4.5/5 (237 reviews)" near the title. Make the review count clickable to scroll to the review section.

### Trust: Review Filtering Available
- **What to check:** Users can filter reviews by star rating, verified purchase, and optionally by topic or product variant.
- **Why it matters:** Users seeking negative reviews (to assess worst-case scenarios) need filtering. Letting users find relevant reviews increases trust and reduces return rates.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add filter buttons or tabs for each star level. Show the count per level. Allow filtering by "Verified Purchase." For variant products, allow filtering by the specific variant.

### Trust: Return Policy Visible
- **What to check:** The return policy is visible or linked on the product page. Key terms (days, conditions, free/paid returns) are summarized.
- **Why it matters:** 67% of shoppers check the return policy before purchasing (UPS study). A visible, generous return policy increases conversion by 17% (Narvar).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show a brief return policy summary near the buy button: "Free 30-day returns." Link to the full policy. Use an icon (return arrow) for quick recognition.

### Trust: Secure Checkout Badge
- **What to check:** A trust badge or secure checkout indicator appears near the Add to Cart button.
- **Why it matters:** 17% of users abandon because they don't trust the site with credit card info (Baymard). A security badge at the point of commitment reduces this.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place a small "Secure Checkout" badge or payment method icons near the Add to Cart button. Don't overdo it — 1-2 trust indicators are sufficient.

### Product Details: Clear Product Description
- **What to check:** The product has a detailed description that covers features, materials, dimensions, use cases, and any relevant specifications.
- **Why it matters:** 20% of failed purchases are due to incomplete product information (eBay research). Detailed descriptions reduce returns by setting accurate expectations.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Write descriptions that answer buyer questions: What is it? What's it made of? How big is it? How do I use it? Include bullet points for specs and a paragraph for benefits.

### Product Details: Specifications in Structured Format
- **What to check:** Technical specifications (dimensions, weight, materials, compatibility) are displayed in a structured format (table or definition list), not buried in prose.
- **Why it matters:** Buyers comparing products need scannable specs. Structured specifications are 40% faster to scan than paragraph format (NNGroup eye-tracking).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use a specs table or key-value list. Include dimensions (with units), weight, materials, color, compatibility, and any product-specific attributes.

### Product Details: Breadcrumb Navigation
- **What to check:** Breadcrumbs show the product's location in the category hierarchy (e.g., Home > Men > Jackets > Denim Jacket).
- **Why it matters:** Breadcrumbs help users navigate back to categories and understand the product's context. They also generate SEO-friendly internal links.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Display breadcrumbs above the product title. Make each level clickable. Include the full path from home to the current product. Use schema.org BreadcrumbList markup.

### Cross-Selling: Related Products Section
- **What to check:** A "Related Products," "You May Also Like," or "Customers Also Bought" section appears below the product details.
- **Why it matters:** Cross-selling recommendations generate 35% of Amazon's revenue (McKinsey). Related products increase average order value and provide alternatives if the current product isn't right.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show 4-8 related products below the main product content. Include thumbnail, name, price, and rating. Use collaborative filtering or category-based recommendations.

### Cross-Selling: Recently Viewed Products
- **What to check:** A "Recently Viewed" section shows products the user has previously looked at during this session.
- **Why it matters:** Users often compare products by going back and forth. Recently viewed items reduce navigation friction and increase conversion by 6-8% (Barilliance).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Show the last 4-8 viewed products in a horizontal carousel. Place near the bottom of the page. Persist across sessions using localStorage or cookies.

### SEO: Schema.org Product Markup
- **What to check:** The product page includes structured data (JSON-LD) with Schema.org Product markup including name, image, description, sku, offers (price, availability), and aggregateRating.
- **Why it matters:** Product schema enables rich results in Google Search (price, availability, ratings shown in search results). Rich results increase CTR by 30% (Search Engine Journal).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add JSON-LD with @type Product. Include: name, image, description, sku, brand, offers (price, priceCurrency, availability, url), and aggregateRating. Validate with Google Rich Results Test.

### Performance: Product Images Lazy Loaded
- **What to check:** Gallery images beyond the first one use lazy loading. The first/main image loads immediately.
- **Why it matters:** Product pages with 5+ images can be image-heavy. Lazy loading reduces initial page weight by 40-60% while keeping the user experience smooth.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Load the main product image immediately (it's the LCP element). Lazy load additional gallery images. Preload the main image in the <head>.

### Mobile: Sticky Add to Cart on Mobile
- **What to check:** On mobile viewports, a sticky "Add to Cart" bar appears at the bottom of the screen as the user scrolls past the main buy button.
- **Why it matters:** Mobile product pages require significant scrolling (reviews, description, specs). A sticky buy button ensures the purchase action is always one tap away.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show a sticky bar at the bottom of mobile viewports with product name, price, and "Add to Cart" button. Appear after the main buy button scrolls out of view.

### Mobile: Image Gallery Swipeable
- **What to check:** On mobile, product images can be swiped left/right in a carousel or gallery. Dots or thumbnails indicate the number of images.
- **Why it matters:** Mobile users expect swipe gestures for image galleries. Tap-only galleries miss 30% of image views because users don't notice additional images.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Implement a swipeable image carousel. Show dots below indicating total images and current position. Support pinch-to-zoom within the gallery. Keep swipe gestures smooth.

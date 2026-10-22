# Snack Shelf Scout

Build a mobile-first personal snack and food inventory web app called Snack Home. The user is a beginner and wants a practical working first version, not just a landing page. Use Chinese (Simplified) UI throughout. Core flows: (1) Home dashboard with current inventory, items nearing expiry, and quick actions. (2) Add/edit food with name, barcode (manual entry for now; design the UI so a camera scanner can be added later), brand, package size, quantity, unit, storage location, purchase/opened date, expiry date, photo upload if supported, ingredients, allergens, calories and nutrition facts per 100g/per serving, plus a data-source/confidence indicator. Allow manual entry when product lookup fails. (3) Inventory list searchable/filterable by category, location, and expiry status. (4) Track separate batches of the same product with different expiry dates; do not merge batches in a way that loses expiry information. (5) Simulated snack-shop/cart flow: add available inventory items to cart, show a checkout summary, then on confirming pickup ask whether the user ate all, ate some, or returned it; only then adjust the correct batch quantity. (6) Expiry reminders page highlighting items expiring in 3 days and 1 day; calculate dates dynamically from today's date, no hardcoded demo date. (7) Food detail page showing ingredients, allergens, calories/nutrition, storage location and expiry; dietary preference settings for user-entered allergies and calorie goals, with cautious warnings when ingredient data is missing rather than claiming an item is safe. (8) Settings for dietary preferences and notification preferences. Use realistic demo food data, but clearly label it as demo data. Make navigation and all core interactions work. Persist data between refreshes using an appropriate browser persistence approach for this first build, and organize the code so a cloud database can be added later. Do not pretend barcode lookup, camera scanning, push notifications, or cloud sync are implemented unless they actually are. Provide a polished, simple, phone-friendly interface and ensure it also works on desktop. Start by implementing the full UI and working core flows with demo data; explain any remaining setup required for durable cloud persistence, real barcode lookup, scanning, and notifications.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://snack-shelf-scout.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4d29444c-f058-40c6-bade-9445164f8f7d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

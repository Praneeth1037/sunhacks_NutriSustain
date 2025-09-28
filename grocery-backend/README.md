# Grocery Management Backend

A Node.js backend for the grocery management app with free recipe generation using Spoonacular API.

## Features

- Grocery item CRUD operations
- Expiry date tracking and notifications
- WebSocket real-time updates
- Free recipe generation using Spoonacular API
- Daily scheduler for expiry checks

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Spoonacular API Key (FREE)

Create a `.env` file in the backend directory:

```bash
cp env.example .env
```

Edit `.env` and add your Spoonacular API key:

```
SPOONACULAR_API_KEY=your-spoonacular-api-key-here
PORT=3001
```

### 3. Get FREE Spoonacular API Key

1. Go to [Spoonacular API](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Go to your dashboard
4. Copy your API key
5. Add it to your `.env` file

**FREE TIER**: 150 requests per day, 1 request per second

### 4. Run the Server

```bash
node server.js
```

The server will start on port 3001 and show:
- ✅ Spoonacular API key configured - Free recipe generation enabled
- ⚠️ Spoonacular API key not configured - using predefined recipes only

## API Endpoints

### Grocery Items
- `GET /groceryItems` - Get all items
- `POST /groceryItems` - Create new item
- `PUT /groceryItems/:id` - Update item
- `DELETE /groceryItems/:id` - Delete item

### Recipe Generation
- `POST /recipes/search` - Search recipes with Spoonacular API
- `POST /recipes/suggestions` - Get recipe suggestions for expiring items

### Health Check
- `GET /health` - Server status

## Free Recipe Generation

The app uses Spoonacular's free API to generate recipes based on:
- Available ingredients in your inventory
- Expiring items
- Your search query

### Example Recipe Request

```json
{
  "query": "chicken curry",
  "expiringItems": [
    {"productName": "Chicken", "category": "Meat", "quantity": 1}
  ]
}
```

### Recipe Response

```json
{
  "success": true,
  "recipes": [{
    "title": "Authentic Chicken Curry",
    "type": "Main Course",
    "ingredients": [
      {"name": "Chicken", "amount": "500g", "expiring": true},
      {"name": "Onions", "amount": "2 medium", "expiring": false}
    ],
    "steps": ["Step 1", "Step 2"],
    "tips": "This recipe takes about 45 minutes to prepare..."
  }],
  "source": "Spoonacular"
}
```

## Fallback System

If Spoonacular API fails or is not configured, the system automatically falls back to predefined recipes for:
- Tomato Curry
- Potato Curry
- Chicken Curry
- Pasta
- Salad
- Dal

## WebSocket Events

- `expiring_items` - Items expiring within 3 days
- `new_expiring_item` - New item added that's expiring soon

## Environment Variables

- `SPOONACULAR_API_KEY` - Your Spoonacular API key (FREE)
- `PORT` - Server port (default: 3001)

## Free API Benefits

- **No cost** - 150 free requests per day
- **Real recipes** - From Spoonacular's database
- **Detailed instructions** - Step-by-step cooking guides
- **Nutrition info** - Cooking time and tips
- **Fallback system** - Always works even without API key

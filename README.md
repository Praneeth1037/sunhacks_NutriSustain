# 🥗 NutriSustain - Smart Grocery Management with AI

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)
[![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-GPT--4-orange.svg)](https://azure.microsoft.com/en-us/services/cognitive-services/openai-service/)

> **A comprehensive full-stack application that combines smart grocery management, health tracking, and AI-powered insights to reduce food waste and promote healthier eating habits.**

## 🌟 Features

### 🛒 Smart Grocery Management
- **Inventory Tracking**: Add, update, and manage grocery items with expiry dates
- **Camera OCR**: Scan product labels using Tesseract.js for automatic data entry
- **Auto-Expiry Detection**: Real-time status updates (Active/Expired/Consumed)
- **Category Management**: Organize items by Fruits, Vegetables, Meat, Dairy, Grains, etc.

### 🤖 AI-Powered Recipe Generation
- **Azure OpenAI Integration**: Generate personalized recipes based on available ingredients
- **Expiring Items Focus**: Get recipe suggestions for items nearing expiry
- **Nutrition Facts**: AI-calculated nutrition information per 100g
- **Ingredient Matching**: Smart recipe suggestions using your inventory

### 🏥 Health Intelligence
- **Health Metrics Tracking**: Monitor blood sugar, cholesterol, blood pressure, weight, height
- **PDF Health Reports**: Upload and extract data from medical reports
- **AI Health Analysis**: Personalized risk assessment and recommendations
- **Food Recommendations**: Avoid/prefer lists based on health conditions

### 📊 Analytics Dashboard
- **Monthly Trends**: Track consumption patterns and waste reduction
- **Category Analysis**: Visual breakdown of grocery categories
- **Efficiency Metrics**: Calculate waste rates and efficiency scores
- **Interactive Charts**: Beautiful 3D visualizations with Recharts

### 🗑️ Waste Tracking
- **Expired Items Management**: Track and analyze food waste
- **Cost Calculation**: AI-powered waste cost estimation
- **Financial Impact**: Monitor savings from waste reduction
- **Optimized Loading**: Fast, responsive waste analysis

### 🔔 Smart Alerts
- **Expiry Notifications**: Real-time alerts for items expiring within 5 days
- **WebSocket Integration**: Live updates across all connected devices
- **Direct Navigation**: Quick access to recipe suggestions for expiring items

## 🚀 Tech Stack

### Frontend
- **React 19.1.1** - Modern UI framework
- **Recharts** - Data visualization and analytics
- **Tesseract.js** - Client-side OCR for image text extraction
- **React-Webcam** - Camera access for product scanning
- **@dnd-kit** - Drag and drop functionality
- **WebSocket** - Real-time communication

### Backend
- **Express.js** - RESTful API server
- **MongoDB** - NoSQL database with Mongoose ODM
- **Azure OpenAI** - AI-powered recipe generation and health analysis
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction
- **Node-Cron** - Scheduled tasks for expiry checks
- **WebSocket** - Real-time notifications

## 📁 Project Structure

```
NutriSustain/
├── grocery-app/                 # React Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── HomePage.js
│   │   │   ├── ManualGroceryEntry.js
│   │   │   ├── RecipeSuggestions.js
│   │   │   ├── SugarHealthTracker.js
│   │   │   ├── NewAnalytics.js
│   │   │   ├── WastedItems.js
│   │   │   └── ...
│   │   ├── styles/
│   │   │   └── design-system.css
│   │   └── App.js
│   └── package.json
├── grocery-backend/             # Node.js Backend
│   ├── server.js               # Main server file
│   ├── models/                 # MongoDB models
│   ├── config/                 # Database configuration
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Azure OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/nutrisustain.git
cd nutrisustain
```

### 2. Backend Setup
```bash
cd grocery-backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
PORT=3001
```

Start the backend server:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd grocery-app
npm install
```

Start the React development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔧 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/groceries_db
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
PORT=3001
```

## 📱 Usage

### Adding Grocery Items
1. Navigate to "Add Grocery" section
2. Fill in product details or use camera scan
3. Items are automatically categorized and tracked

### AI Recipe Generation
1. Go to "AI Recipe Suggestions"
2. Search for recipes or get suggestions for expiring items
3. View nutrition facts and cooking instructions

### Health Tracking
1. Access "Health Intelligence" section
2. Enter health metrics or upload PDF reports
3. Get AI-powered health analysis and food recommendations

### Analytics
1. Visit "Analytics" for comprehensive insights
2. View monthly trends, waste analysis, and efficiency metrics
3. Track your progress in reducing food waste

## 🎯 Key Benefits

- **Reduce Food Waste**: Up to 50% reduction through smart management
- **Save Money**: Average $1,500 annual savings per family
- **Health Insights**: Personalized recommendations based on health data
- **Real-time Updates**: Live notifications and status updates
- **AI-Powered**: Intelligent recipe suggestions and health analysis

## 🔄 Real-time Features

- **WebSocket Integration**: Live updates across all devices
- **Scheduled Tasks**: Daily expiry checks at 9 AM
- **Optimistic UI**: Fast, responsive user experience
- **Auto-reconnection**: Seamless connection management

## 📊 Performance Optimizations

- **React.memo**: Component memoization for better performance
- **useMemo**: Expensive calculation optimization
- **Optimistic Loading**: Immediate UI feedback
- **Lazy Loading**: Code splitting for faster initial load

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Azure OpenAI** for AI-powered recipe generation and health analysis
- **MongoDB Atlas** for cloud database hosting
- **Recharts** for beautiful data visualizations
- **Tesseract.js** for client-side OCR capabilities

## 📞 Support

For support, email support@nutrisustain.com or join our Slack channel.

---

**Made with ❤️ for a sustainable future**

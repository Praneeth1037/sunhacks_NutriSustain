# 🚀 Deployment Guide for NutriSustain

This guide covers various deployment options for the NutriSustain application.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Azure OpenAI API key
- Domain name (optional)
- SSL certificate (for production)

## 🌐 Deployment Options

### 1. Heroku Deployment

#### Backend Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create nutrisustain-backend

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set AZURE_OPENAI_API_KEY=your_azure_openai_api_key
heroku config:set AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
heroku config:set AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix grocery-backend heroku main
```

#### Frontend Deployment
```bash
# Create Heroku app for frontend
heroku create nutrisustain-frontend

# Set buildpack for React
heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git

# Set environment variables
heroku config:set REACT_APP_API_URL=https://nutrisustain-backend.herokuapp.com

# Deploy
git subtree push --prefix grocery-app heroku main
```

### 2. Vercel Deployment

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd grocery-app
vercel

# Set environment variables in Vercel dashboard
REACT_APP_API_URL=https://your-backend-url.com
```

#### Backend (Vercel)
```bash
# Deploy backend
cd grocery-backend
vercel

# Set environment variables in Vercel dashboard
MONGODB_URI=your_mongodb_atlas_connection_string
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

### 3. Netlify Deployment

#### Frontend (Netlify)
```bash
# Build the React app
cd grocery-app
npm run build

# Deploy to Netlify
# Option 1: Drag and drop the build folder to Netlify
# Option 2: Connect GitHub repository to Netlify

# Set environment variables in Netlify dashboard
REACT_APP_API_URL=https://your-backend-url.com
```

### 4. AWS Deployment

#### Using AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

#### Using AWS EC2
```bash
# Launch EC2 instance
# Install Node.js and PM2
sudo apt update
sudo apt install nodejs npm
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/nutrisustain.git
cd nutrisustain

# Install dependencies
cd grocery-backend
npm install
cd ../grocery-app
npm install

# Build frontend
npm run build

# Start with PM2
cd ../grocery-backend
pm2 start server.js --name "nutrisustain-backend"
```

### 5. DigitalOcean Deployment

#### Using DigitalOcean App Platform
```yaml
# .do/app.yaml
name: nutrisustain
services:
- name: backend
  source_dir: grocery-backend
  github:
    repo: yourusername/nutrisustain
    branch: main
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: MONGODB_URI
    value: your_mongodb_atlas_connection_string
  - key: AZURE_OPENAI_API_KEY
    value: your_azure_openai_api_key
  - key: AZURE_OPENAI_ENDPOINT
    value: your_azure_openai_endpoint
  - key: AZURE_OPENAI_DEPLOYMENT_NAME
    value: your_deployment_name

- name: frontend
  source_dir: grocery-app
  github:
    repo: yourusername/nutrisustain
    branch: main
  build_command: npm run build
  run_command: npx serve -s build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: REACT_APP_API_URL
    value: ${backend.PUBLIC_URL}
```

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/groceries_db
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_ENVIRONMENT=production
```

## 🗄️ Database Setup

### MongoDB Atlas Configuration
1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist your deployment IP addresses
4. Get the connection string
5. Update environment variables

### Database Indexes
```javascript
// Add these indexes for better performance
db.groceryitems.createIndex({ "status": 1 })
db.groceryitems.createIndex({ "expiryDate": 1 })
db.groceryitems.createIndex({ "category": 1 })
db.healthmetrics.createIndex({ "lastUpdated": -1 })
```

## 🔒 Security Considerations

### Production Security
- Use HTTPS for all communications
- Implement rate limiting
- Add input validation and sanitization
- Use environment variables for secrets
- Implement CORS properly
- Add security headers

### Example Security Middleware
```javascript
// Add to server.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## 📊 Monitoring and Logging

### Application Monitoring
- Set up error tracking (Sentry, Bugsnag)
- Monitor performance (New Relic, DataDog)
- Set up uptime monitoring (Pingdom, UptimeRobot)
- Configure log aggregation (Loggly, Papertrail)

### Health Checks
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "nutrisustain-backend"
        heroku_email: "your-email@example.com"
        appdir: "grocery-backend"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './grocery-app/build'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
        enable-pull-request-comment: false
        enable-commit-comment: true
        overwrites-pull-request-comment: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🔄 Database Migrations

### Migration Scripts
```javascript
// migrations/001_add_indexes.js
const mongoose = require('mongoose');

async function addIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    // Add indexes
    await db.collection('groceryitems').createIndex({ "status": 1 });
    await db.collection('groceryitems').createIndex({ "expiryDate": 1 });
    await db.collection('healthmetrics').createIndex({ "lastUpdated": -1 });
    
    console.log('Indexes added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addIndexes();
```

## 📱 Mobile App Deployment

### React Native (Future)
- Use Expo for development
- Deploy to App Store and Google Play
- Implement push notifications
- Add offline capabilities

## 🌍 CDN and Performance

### CDN Setup
- Use Cloudflare for global CDN
- Optimize images and assets
- Enable gzip compression
- Implement caching strategies

### Performance Optimization
```javascript
// Add compression middleware
const compression = require('compression');
app.use(compression());

// Add caching headers
app.use((req, res, next) => {
  if (req.path.startsWith('/static/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});
```

## 🔍 Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS configuration
2. **Database Connection**: Verify MongoDB URI and network access
3. **Environment Variables**: Ensure all required variables are set
4. **Build Failures**: Check Node.js version compatibility
5. **Memory Issues**: Increase memory limits for large applications

### Debug Commands
```bash
# Check application logs
heroku logs --tail

# Check environment variables
heroku config

# Restart application
heroku restart

# Check database connection
heroku run node -e "console.log(process.env.MONGODB_URI)"
```

## 📞 Support

For deployment issues:
- Check the troubleshooting section
- Review application logs
- Contact support@nutrisustain.com
- Create an issue on GitHub

---

**Happy Deploying! 🚀**

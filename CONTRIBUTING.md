# Contributing to NutriSustain

Thank you for your interest in contributing to NutriSustain! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Azure OpenAI API key
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/nutrisustain.git
   cd nutrisustain
   ```

2. **Backend Setup**
   ```bash
   cd grocery-backend
   npm install
   cp env.example .env
   # Edit .env with your credentials
   ```

3. **Frontend Setup**
   ```bash
   cd grocery-app
   npm install
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd grocery-backend
   node server.js

   # Terminal 2 - Frontend
   cd grocery-app
   npm start
   ```

## 📋 How to Contribute

### 1. Choose an Issue
- Look for issues labeled `good first issue` for beginners
- Check `help wanted` for areas needing assistance
- Create a new issue if you find a bug or have a feature request

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### 4. Commit Changes
```bash
git add .
git commit -m "Add: brief description of changes"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```
Then create a Pull Request on GitHub.

## 🎯 Areas for Contribution

### Frontend (React)
- **Components**: New UI components, improvements to existing ones
- **Styling**: CSS improvements, responsive design, animations
- **Performance**: Optimization, lazy loading, memoization
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Backend (Node.js/Express)
- **API Endpoints**: New routes, improvements to existing ones
- **Database**: Schema improvements, query optimization
- **AI Integration**: Azure OpenAI enhancements, new AI features
- **Security**: Authentication, authorization, input validation

### Features
- **Grocery Management**: Enhanced tracking, new categories, better OCR
- **Health Intelligence**: New health metrics, improved analysis
- **Analytics**: New charts, better insights, export functionality
- **AI Features**: Recipe improvements, health recommendations

## 📝 Code Style Guidelines

### JavaScript/React
- Use ES6+ features
- Prefer functional components with hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Follow React best practices

### CSS
- Use CSS custom properties (variables)
- Follow BEM methodology for class names
- Use flexbox/grid for layouts
- Keep styles modular and reusable

### Backend
- Use async/await over callbacks
- Implement proper error handling
- Add input validation
- Use meaningful variable names
- Add comments for complex logic

## 🧪 Testing

### Frontend Testing
```bash
cd grocery-app
npm test
```

### Backend Testing
```bash
cd grocery-backend
npm test
```

### Manual Testing
- Test all user flows
- Check responsive design
- Verify accessibility
- Test with different data sets

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document complex algorithms
- Explain business logic
- Update README for new features

### API Documentation
- Document new endpoints
- Include request/response examples
- Add error codes and messages
- Update API version if needed

## 🐛 Bug Reports

When reporting bugs, please include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to recreate the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable

## 💡 Feature Requests

When suggesting features, please include:
- **Description**: Clear description of the feature
- **Use Case**: Why this feature would be useful
- **Implementation Ideas**: How you think it could be implemented
- **Alternatives**: Other ways to solve the problem

## 🔄 Pull Request Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority: high`: High priority issue
- `priority: low`: Low priority issue

## 📞 Getting Help

- **Discord**: Join our community server
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: support@nutrisustain.com
- **Issues**: Create an issue for bugs or feature requests

## 🎉 Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Given credit in the application
- Invited to the core team (for significant contributions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NutriSustain! Together, we can build a better future for food sustainability and health management. 🌱

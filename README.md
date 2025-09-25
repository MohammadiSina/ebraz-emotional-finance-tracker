# 💰 Ebraz: AI-Powered Emotional Finance Tracker

> **Personal finance through emotional intelligence and AI-driven insights**

**Ebraz** is a cutting-edge personal finance application that bridges the gap between financial data and emotional well-being. Unlike traditional budgeting apps that focus solely on numbers, Ebraz leverages artificial intelligence to understand the *emotional context* behind every financial decision, helping users build healthier relationships with money.

## 🌟 The Problem Ebraz Solved

Traditional finance apps treat money as purely transactional. But spending is deeply emotional—driven by stress, joy, impulse, or necessity. **Ebraz** recognizes this reality and provides:

- **Emotional Intelligence**: Track not just *what* you spent, but *how it made you feel*
- **AI-Powered Insights**: Monthly personalized coaching powered by OpenAI's advanced language models
- **Behavioral Pattern Recognition**: Identify emotional spending triggers and financial habits
- **Culturally-Aware Analysis**: Designed with Iranian economic realities in mind (inflation, currency fluctuations)

## 🚀 Key Features

### Core Functionality
- **Multi-Currency Support**: Real-time exchange rate tracking (IRT ↔ USD) by using BitPin Exchange API
- **Emotional Transaction Tagging**: 6 emotion categories (Regret, Satisfaction, Stress, Neutral, Guilt, Relief)
- **Intent Classification**: Planned, Impulsive, or Mandatory spending patterns
- **Reflection Notes**: Personal insights that enhance AI analysis
- **Comprehensive Analytics**: Spending breakdowns by emotion, intent, and category

### AI-Powered Intelligence
- **Monthly Insight Generation**: Automated personalized financial coaching
- **Cultural Sensitivity**: AI prompts designed for Iranian economic context
- **Emotional Support**: Empathetic, non-judgmental financial guidance
- **Actionable Recommendations**: Practical tips for healthier spending habits

### Technical Excellence
- **Real-time Processing**: BullMQ job queues for scalable AI processing
- **Advanced Analytics**: Multi-dimensional spending analysis and reporting
- **Secure Authentication**: JWT-based user management with role-based access
- **GraphQL API**: Type-safe, efficient data querying and mutations

## 🛠️ Technical Architecture

### Backend Stack
- **Framework**: NestJS (TypeScript-first Node.js framework)
- **API**: GraphQL with Apollo Server
- **Database**: MySQL with Prisma ORM
- **Caching**: Redis for performance optimization
- **Queue Management**: BullMQ for background job processing
- **AI Integration**: OpenAI API for intelligent insights generation

### Key Technical Features
- **Modular Architecture**: Clean separation of concerns across 6 core modules
- **Type Safety**: Full TypeScript implementation with strict typing
- **Database Migrations**: Version-controlled schema management
- **Background Processing**: Asynchronous AI insight generation
- **Rate Limiting**: OpenAI API compliance with intelligent queuing

### Database Schema
- **Users**: Role-based authentication and profile management
- **Transactions**: Multi-currency financial records with emotional metadata
- **Insights**: AI-generated monthly financial coaching reports
- **Exchange Rates**: Real-time currency conversion tracking

## 📊 Analytics & Reporting

### Advanced Metrics
- **Net Balance Analysis**: Income vs. expense tracking with currency conversion
- **Emotional Spending Patterns**: Breakdown by emotion categories and percentages
- **Intent Analysis**: Planned vs. impulsive spending insights
- **Category Spending**: Detailed breakdown across 18+ spending categories
- **Savings Rate Calculation**: Automated savings percentage tracking
- **Top Transactions**: High-impact spending identification

### AI-Generated Insights
- **Personalized Coaching**: Monthly reports tailored to individual spending patterns
- **Emotional Validation**: Acknowledgment of financial stress and challenges
- **Cultural Context**: Understanding of Iranian economic realities
- **Actionable Advice**: Practical, implementable financial improvement suggestions

## 🔧 Development & Deployment

### Getting Started
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm dlx prisma migrate dev

# Start development server
pnpm run start:dev
```

### Available Scripts
- `pnpm run build` - Production build
- `pnpm run start:dev` - Development server with hot reload
- `pnpm run test` - Run test suite

## 🌍 Cultural Impact

**Ebraz** is specifically designed to address the unique financial challenges faced by Iranian users:
- **Currency Volatility**: Real-time IRT/USD conversion tracking
- **Economic Inflation**: AI insights consider local economic pressures
- **Cultural Spending Patterns**: Understanding of local financial behaviors
- **Bilingual Support**: Persian/English language detection and response

## 🎯 Target Audience

- **Financially Conscious Individuals**: Seeking deeper understanding of spending habits
- **Mental Health Advocates**: Recognizing the emotional component of financial decisions
- **Tech-Savvy Users**: Appreciating AI-powered insights and modern UX
- **Iranian Market**: Specifically designed for local economic realities

## 🔮 Future Roadmap

- **Data Visualization**: Interactive emotion-spending charts and graphs
- **Export & Backup**: Comprehensive data portability features
- **Social Features**: Optional community support and shared insights
- **Integration APIs**: Connect with local banks and financial institutions
- **Improvements**: Add logging mechanism, better caching and testing, etc.

## 💡 Innovation Highlights

- **First-of-its-kind**: Emotional intelligence in personal finance tracking
- **AI-Powered Coaching**: Monthly personalized financial guidance
- **Cultural Sensitivity**: Designed specifically for Iranian economic context
- **Modern Tech Stack**: Cutting-edge technologies for optimal performance
- **Scalable Architecture**: Built for growth and feature expansion

---

**Built with 🖤 for a healthier relationship with money**

*Ebraz: Where financial data meets emotional intelligence*
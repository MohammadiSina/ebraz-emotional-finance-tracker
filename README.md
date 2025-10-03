# Ebraz: AI-Powered Emotional Finance Tracker

> **Personal finance through emotional intelligence and AI-driven insights**

**Ebraz** is a cutting-edge personal finance application that bridges the gap between financial data and emotional well-being. Unlike traditional budgeting apps that focus solely on numbers, Ebraz leverages artificial intelligence to understand the *emotional context* behind every financial decision, helping users build healthier relationships with money.

## 🌟 The Problem Ebraz Solved

Traditional finance apps treat money as purely transactional. But spending is deeply emotional—driven by stress, joy, impulse, or necessity. **Ebraz** recognizes this reality and provides:

- **Emotional Intelligence**: Track not just *what* you spent, but *how it made you feel*
- **AI-Powered Insights**: Monthly personalized coaching powered by OpenAI's advanced language models
- **Behavioral Pattern Recognition**: Identify emotional spending triggers and financial habits
- **Culturally-Aware Analysis**: Designed with Iranian economic realities in mind (inflation, currency fluctuations)

## 🚀 Key Features

- **Multi-Currency Support**: Real-time IRT ↔ USD exchange rates via BitPin API
- **Emotional Finance Tracking**: Tag transactions with emotions (Regret, Satisfaction, Stress, etc.)
- **AI-Powered Insights**: Monthly personalized financial coaching with cultural sensitivity
- **Comprehensive Analytics**: Spending breakdowns by emotion, intent, and category
- **GraphQL API**: Type-safe, efficient data querying with JWT authentication

## 📊 Analytics & Reporting

- **Net Balance Analysis**: Income vs. expense tracking with currency conversion
- **Emotional Spending Patterns**: Breakdown by emotion categories and percentages
- **Intent Analysis**: Planned vs. impulsive spending insights
- **Category Spending**: Detailed breakdown across 18+ spending categories
- **AI-Generated Insights**: Monthly personalized financial coaching reports

## 🛠️ Tech Stack

- **Backend**: NestJS + TypeScript + GraphQL + Apollo Server
- **Database**: MySQL + Prisma ORM
- **Caching**: Redis for performance optimization
- **Queue**: BullMQ for background AI processing
- **AI**: OpenAI API for intelligent insights generation

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


## 🔮 Future Roadmap

- **Data Visualization**: Interactive emotion-spending charts and graphs
- **Export & Backup**: Comprehensive data portability features
- **Social Features**: Optional community support and shared insights
- **Integration APIs**: Connect with local banks and financial institutions
- **Improvements**: Add logging mechanism, better caching and testing, etc.
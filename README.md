# ScriptyBoy MVP Module 1
## AI-Powered Screenplay Analysis Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/sandeepvarmac/Scripty)
[![Coverage](https://img.shields.io/badge/coverage-85%25-success)](https://github.com/sandeepvarmac/Scripty)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/sandeepvarmac/Scripty)

Professional screenplay analysis powered by tiered AI intelligence. ScriptyBoy provides industry-standard coverage reports, actionable feedback, and comprehensive analytics for screenwriters and development executives.

## ✨ Features

### 🎬 **Professional Analysis Pipeline**
- **Tiered LLM Intelligence**: gpt-5-mini → gpt-5 → gpt-5-thinking escalation
- **8-Stage Analysis**: sanitize → parse → normalize → detectors → scoring → assets → persist → notify
- **Structured Outputs**: JSON Schema validation for consistent results

### 📊 **Comprehensive Dashboard**
- **Coverage Tab**: Industry-standard recommendations (PASS/CONSIDER/RECOMMEND)
- **Craft Analysis**: Structure, beats, dialogue, theme, risk assessment
- **Character Analytics**: Presence grids, dialogue distribution, arc analysis
- **Pacing Insights**: Tension waveforms, complexity heatmaps, beat timing
- **Feasibility Metrics**: Production cost estimation and complexity analysis
- **Notes Management**: Location-anchored feedback with severity levels

### 📄 **Professional Deliverables**
- **Coverage PDFs**: Publication-ready industry reports
- **Notes Export**: CSV/PDF with excerpts and suggestions
- **Analysis Data**: Complete JSON/CSV exports
- **FDX Change Lists**: Final Draft integration with tracked changes

### 🎯 **Format Support**
- **Upload**: PDF, FDX, Fountain, TXT
- **OCR Integration**: Automated text extraction from PDFs
- **Progress Tracking**: Real-time analysis status updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL 13+
- OpenAI API key

### Installation

```bash
# Clone repository
git clone https://github.com/sandeepvarmac/Scripty.git
cd Scripty

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3006](http://localhost:3006) to access ScriptyBoy.

## 📖 User Guide

### 1. **Create Project**
```
Home → New Project → Enter details → Create
```

### 2. **Upload Script**
```
Project Dashboard → Upload Script → Select file → Confirm details
```

### 3. **Run Analysis**
```
Script Overview → Start Analysis → Monitor progress → View results
```

### 4. **Explore Dashboard**
- **Coverage**: Overall assessment and recommendation
- **Craft**: Detailed structural and creative analysis
- **Characters**: Character development and presence tracking
- **Pacing**: Rhythm and tension analysis
- **Feasibility**: Production complexity assessment
- **Notes**: Actionable feedback with location anchors
- **Exports**: Professional deliverable generation

### 5. **Generate Exports**
```
Exports Tab → Select formats → Configure options → Generate → Download
```

## 🧪 Testing

ScriptyBoy includes comprehensive testing across multiple layers:

### Test Suites
```bash
# All tests
npm run test:all

# Unit tests
npm run test
npm run test:watch
npm run test:coverage

# Gold script validation
npm run test:gold

# API contract tests
npm run test:api

# Schema validation
npm run test:schema

# QA acceptance criteria
npm run test:qa

# End-to-end tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

### Coverage Requirements
- **Lines**: 70% minimum
- **Functions**: 70% minimum
- **Branches**: 70% minimum
- **Statements**: 70% minimum

See [Testing Guide](docs/TESTING.md) for detailed documentation.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with full-text search
- **AI**: OpenAI GPT models with structured outputs
- **Charts**: Recharts for data visualization
- **Testing**: Jest, Playwright, Supertest

### Database Schema
```sql
-- Core entities
Scripts → Analysis Pipeline → Dashboard Data
├── beats (story structure)
├── notes (actionable feedback)
├── scores (rubric ratings)
├── page_metrics (pacing data)
├── character_scenes (presence tracking)
├── feasibility_metrics (production analysis)
├── risk_flags (content warnings)
└── export_jobs (deliverable tracking)
```

### API Architecture
```
/api/v1/
├── projects/:id/upload          # Script upload
├── scripts/:id/dashboard        # Analysis data
├── scripts/:id/parse-preview    # Script structure
├── scripts/:id/exports          # Export generation
├── scenes/:id                   # Scene details
├── reports/coverage             # Coverage PDFs
└── notes/export                 # Notes exports
```

## 🔧 Development

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Build verification
npm run build
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/scriptyboy"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3006"

# AI Services
OPENAI_API_KEY="sk-..."

# Optional: File Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="..."
```

## 📚 API Documentation

### OpenAPI Specification
- **Documentation**: [docs/openapi.yaml](docs/openapi.yaml)
- **Interactive Docs**: `/api/docs` (when running)

### Key Endpoints

#### Upload Script
```http
POST /api/v1/projects/{id}/upload
Content-Type: multipart/form-data

{
  "file": <script-file>,
  "pdfPassword": "optional-password"
}
```

#### Get Dashboard Data
```http
GET /api/v1/scripts/{id}/dashboard

Response: {
  "beats": [...],
  "notes": [...],
  "scores": [...],
  "pageMetrics": [...],
  "characterScenes": [...],
  "feasibility": [...],
  "riskFlags": [...]
}
```

#### Generate Export
```http
POST /api/v1/scripts/{id}/exports

{
  "format": "pdf|csv|json|fdx",
  "type": "coverage|notes|analysis|changelist",
  "includeMetadata": true,
  "emailTo": "optional@email.com"
}
```

## 🚢 Deployment

### Docker Deployment
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Production Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment Setup
1. **Database**: PostgreSQL 13+ with required extensions
2. **Environment**: All required environment variables configured
3. **Storage**: File storage for uploads and exports
4. **Monitoring**: Health checks and error tracking

## 🔐 Security

### Data Protection
- **File Upload**: Virus scanning and format validation
- **Database**: Parameterized queries and input sanitization
- **Authentication**: NextAuth.js with secure sessions
- **API**: Rate limiting and request validation

### Privacy Controls
- **Sensitivity Analysis**: Opt-in project setting
- **Risk Flags**: Non-legal advice disclaimers
- **Data Retention**: Configurable export expiration

## 📈 Performance

### Optimization Features
- **Tiered LLM Routing**: Cost-optimized model selection
- **Structured Outputs**: Consistent response formatting
- **Database Indexing**: Optimized queries for large datasets
- **Caching**: Response caching for repeated requests
- **Lazy Loading**: Component-based loading for large dashboards

### Benchmarks
- **Analysis Pipeline**: ~2-3 minutes for 110-page script
- **Dashboard Loading**: <2 seconds for full data
- **Export Generation**: ~30 seconds for PDF reports
- **Database Queries**: <100ms for dashboard aggregations

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feat/amazing-feature`
3. Make changes with tests
4. Run quality checks: `npm run lint && npm run test`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push branch: `git push origin feat/amazing-feature`
7. Create Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code style
- **Prettier**: Automatic formatting
- **Conventional Commits**: Structured commit messages
- **Test Coverage**: 70% minimum requirement

## 📄 License

Copyright (c) 2024 ScriptyBoy. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 🆘 Support

### Documentation
- **Testing Guide**: [docs/TESTING.md](docs/TESTING.md)
- **API Reference**: [docs/openapi.yaml](docs/openapi.yaml)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/sandeepvarmac/Scripty/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sandeepvarmac/Scripty/discussions)
- **Email**: support@scriptyboy.com

### Health Check
```bash
curl http://localhost:3006/api/health
```

### Version Information
- **Current Version**: MVP Module 1 (v1.0.0)
- **Build Date**: 2024-09-23
- **Git Branch**: feat/mvp-module1
- **Node Version**: 18+ / 20+

---

**ScriptyBoy MVP Module 1** - Professional AI-powered screenplay analysis for the modern entertainment industry.

Built with ❤️ by the ScriptyBoy team.
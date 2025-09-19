# ScriptyBoy

Professional screenplay analysis powered by AI.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## CI/CD

- **Push to main** → Automatic staging deployment
- **Create tag** → Production deployment with blue-green strategy
- CI runs tests, linting, type checking, and Lighthouse performance audits
- Health check endpoint: `/api/health`

## Environments

- **Development**: `npm run dev` (Port 3006)
- **Staging**: Deployed on push to main
- **Production**: Deployed on version tags (v*)

## Monitoring

- Health checks at `/api/health`
- Error tracking and performance monitoring configured
- Lighthouse CI for performance regression testing

## Requirements

- Node.js 18+ or 20+
- npm or yarn
- Docker (for containerized deployment)
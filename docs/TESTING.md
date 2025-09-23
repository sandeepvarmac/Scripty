# ScriptyBoy Testing Guide

This document describes the comprehensive testing strategy for ScriptyBoy MVP Module 1.

## Testing Architecture

ScriptyBoy uses a multi-layered testing approach:

- **Unit Tests**: Jest for individual component and function testing
- **Integration Tests**: API contract tests and database integration
- **E2E Tests**: Playwright for full user journey testing
- **Gold Script Tests**: Validation against known screenplay structures
- **Schema Validation**: JSON Schema validation for LLM outputs

## Test Categories

### 1. Gold Script Tests (`test/gold-script.test.ts`)

Validates the AI analysis system against a curated feature-length screenplay:

- **Beat Detection**: Ensures all 7 story beats are identified
- **Timing Validation**: Verifies beats occur within expected page windows
- **LLM Router Testing**: Validates tiered model usage
- **Structured Output Validation**: Ensures all outputs match JSON schemas

```bash
npm run test:gold
```

### 2. API Contract Tests (`test/api/contract.test.ts`)

Tests all v1 API endpoints against OpenAPI specifications:

- **Upload Endpoints**: File upload with format validation
- **Analysis Endpoints**: Dashboard data and parse preview
- **Export Endpoints**: PDF, CSV, JSON, and FDX generation
- **Error Handling**: Proper error responses and validation

```bash
npm run test:api
```

### 3. Schema Validation Tests (`test/schema/structured-outputs.test.ts`)

Validates all LLM outputs against defined JSON schemas:

- **Beat Schema**: Story beat structure validation
- **Note Schema**: Analysis note format validation
- **Score Schema**: Rubric scoring validation
- **Risk Flag Schema**: Risk assessment validation
- **Performance Testing**: Large dataset validation

```bash
npm run test:schema
```

### 4. QA & Acceptance Tests (`test/qa/acceptance-criteria.test.ts`)

Validates all MVP Definition of Done criteria:

- **✅ Upload Support**: Multiple format support with progress
- **✅ Parser Preview**: Scene/character extraction with editing
- **✅ Dashboard Population**: All tabs with normalized data
- **✅ Export System**: Complete PDF/CSV/JSON/FDX exports
- **✅ Beat Analysis**: 7 beats with timing flags
- **✅ Note System**: Anchored feedback with suggestions
- **✅ Visualizations**: Charts and analytics
- **✅ Sensitivity Controls**: Gated analysis features

```bash
npm run test:qa
```

### 5. E2E Happy Path Tests (`test/e2e/happy-path.test.ts`)

Complete user journey testing with Playwright:

- **Project Creation**: New project workflow
- **Script Upload**: File upload and processing
- **Analysis Pipeline**: Full 8-stage analysis
- **Dashboard Navigation**: All tabs and interactions
- **Export Generation**: End-to-end export workflow
- **Error Handling**: Graceful failure recovery
- **Accessibility**: ARIA compliance and keyboard navigation
- **Responsive Design**: Mobile/tablet/desktop layouts

```bash
npm run test:e2e
npm run test:e2e:ui      # With UI mode
npm run test:e2e:headed  # With browser visible
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
npm run test           # Unit tests only
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test:e2e       # E2E tests only
```

### Test Data

#### Gold Script
- **Location**: `test/fixtures/gold-scripts/feature-length.fountain`
- **Title**: "THE LAST FRONTIER"
- **Genre**: Science Fiction
- **Length**: 110 pages
- **Expected Beats**: 7 with defined timing windows

#### Expected Results
- **Beats**: `test/fixtures/gold-scripts/expected-beats.json`
- **Validation Rules**: Timing tolerance, confidence thresholds

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration
- TypeScript support
- 60-second timeout for LLM tests
- Coverage thresholds (70% minimum)
- Path mapping for imports

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Parallel execution
- Screenshot/video on failure
- HTML reporting

### Environment Setup
- Test database isolation
- Mock LLM responses for deterministic tests
- Cleanup between test runs

## Coverage Targets

Minimum coverage requirements:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Current coverage focuses on:
- Analysis pipeline components
- API endpoints
- Export system
- Schema validation
- Dashboard data flow

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Code commits to main branch
- Release candidate builds

CI pipeline includes:
1. Lint and type checking
2. Unit and integration tests
3. Gold script validation
4. E2E happy path testing
5. Coverage reporting
6. Performance benchmarks

## Test Data Management

### Database
- Isolated test database
- Automatic cleanup between tests
- Realistic seed data
- Transaction rollback for unit tests

### Files
- Temporary file cleanup
- Export file management
- Fixture data versioning

## Performance Testing

### LLM Response Times
- Timeout configurations for different model tiers
- Escalation timing validation
- Token usage tracking

### Database Performance
- Query optimization validation
- Large dataset handling
- Concurrent request testing

## Debugging Tests

### Failed Tests
```bash
npm run test -- --verbose
npm run test:e2e:headed  # Visual debugging
```

### Coverage Analysis
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Playwright Reports
```bash
npx playwright show-report
```

## Adding New Tests

### Unit Tests
1. Create test files alongside source code
2. Follow naming convention: `*.test.ts`
3. Import test helpers from `jest.setup.js`
4. Mock external dependencies

### E2E Tests
1. Add to `test/e2e/` directory
2. Use `test-id` data attributes for selectors
3. Include accessibility checks
4. Test responsive breakpoints

### Gold Script Tests
1. Update expected results in `test/fixtures/`
2. Add new validation rules
3. Test against multiple script genres
4. Validate edge cases

## Best Practices

### Test Writing
- Descriptive test names
- Arrange-Act-Assert pattern
- Single responsibility per test
- Comprehensive error scenarios

### Test Data
- Deterministic test data
- Realistic edge cases
- Performance test scenarios
- Security test cases

### Maintenance
- Regular test review
- Performance benchmark updates
- Dependency updates
- Documentation updates

## Troubleshooting

### Common Issues
- **Database connection**: Check test database setup
- **LLM timeouts**: Adjust timeout configurations
- **File permissions**: Verify test file access
- **Port conflicts**: Ensure test ports are available

### Debug Commands
```bash
# Verbose test output
npm run test -- --verbose --no-coverage

# Single test file
npm run test -- test/gold-script.test.ts

# E2E debugging
npm run test:e2e -- --debug

# Playwright trace viewer
npx playwright show-trace trace.zip
```

This comprehensive testing strategy ensures ScriptyBoy meets all MVP requirements with high confidence and reliability.
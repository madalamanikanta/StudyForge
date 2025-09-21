# Contributing to StudyForge

Thank you for your interest in contributing to StudyForge! We welcome contributions from everyone. Here's how you can help:

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Project Structure](#-project-structure)
- [Code Style](#-code-style)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Reporting Bugs](#-reporting-bugs)
- [Feature Requests](#-feature-requests)
- [License](#-license)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git

### Setup

1. **Fork the repository**
   
   Click the "Fork" button in the top-right corner of the repository page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/studyforge.git
   cd studyforge
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your configuration.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) in your browser.

## 🔄 Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number-description
   ```

2. **Make your changes**
   - Write your code
   - Add tests if applicable
   - Update documentation

3. **Run tests and linters**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin your-branch-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Submit the PR

## 📁 Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── lib/           # Utility functions and libraries
  ├── hooks/         # Custom React hooks
  ├── styles/        # Global styles and themes
  ├── types/         # TypeScript type definitions
  └── utils/         # Helper functions
```

## 🎨 Code Style

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for all new code
- Use functional components with hooks
- Prefer named exports over default exports
- Write meaningful component and variable names

## 📝 Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## 🔄 Pull Request Process

1. Fill in the PR template completely
2. Ensure all tests pass
3. Get code review from at least one maintainer
4. Address all review comments
5. Your PR will be merged once approved

## 🐛 Reporting Bugs

1. **Check existing issues** to see if the bug has already been reported
2. **Create a new issue** if it doesn't exist
3. **Use the bug report template** and provide as much detail as possible:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/OS version
   - Any error messages

## 💡 Feature Requests

1. **Check existing issues** to see if the feature has been requested
2. **Create a new issue** using the feature request template
3. Describe the feature and why it would be valuable
4. Include any design mockups or examples if possible

## 📄 License

By contributing to StudyForge, you agree that your contributions will be licensed under its [MIT License](LICENSE).

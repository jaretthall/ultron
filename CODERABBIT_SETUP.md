# 🤖 CodeRabbit Setup Guide for Ultron

This guide helps you set up CodeRabbit AI code reviews for the Ultron productivity app.

## 📋 Prerequisites

- Admin access to the GitHub repository
- GitHub account with appropriate permissions

## 🚀 Setup Steps

### 1. Install CodeRabbit GitHub App

1. Visit [CodeRabbit GitHub App](https://github.com/apps/coderabbit-ai)
2. Click "Install" or "Configure"
3. Select your repository or organization
4. Grant necessary permissions:
   - Read access to repository contents
   - Write access to pull request comments
   - Read access to repository metadata

### 2. Authorize CodeRabbit

1. Go to [CodeRabbit Login](https://coderabbit.ai/login)
2. Click "Login with GitHub"
3. Authorize CodeRabbit to access your repositories
4. Select the Ultron repository for code reviews

### 3. Configuration (Already Done!)

The repository already includes `.coderabbit.yaml` with optimized settings for:

- **React/TypeScript** components and hooks
- **Testing** files (Jest, Cypress)
- **Database** schemas and migrations
- **Documentation** and configuration files
- **Security** and performance reviews

## 🎯 What CodeRabbit Reviews

### Automatic PR Reviews
- **Code Quality**: TypeScript patterns, React best practices
- **Security**: Vulnerability detection, secret scanning
- **Performance**: Optimization opportunities, anti-patterns
- **Accessibility**: ARIA compliance, semantic HTML
- **Testing**: Coverage gaps, test quality

### File-Specific Instructions
- `src/components/**`: React component patterns, accessibility
- `src/services/**`: API security, error handling, type safety
- `cypress/**`: E2E test reliability, selector strategies
- `**/*.test.*`: Test coverage, mocking patterns

## 💬 Using CodeRabbit

### In Pull Requests
- CodeRabbit automatically reviews every PR
- Provides line-by-line feedback
- Generates PR summaries
- Suggests improvements

### Interactive Chat
```
@coderabbitai explain this function
@coderabbitai suggest performance improvements
@coderabbitai review for accessibility issues
```

### Common Commands
- `@coderabbitai review` - Trigger a new review
- `@coderabbitai explain` - Explain code functionality
- `@coderabbitai suggest` - Get improvement suggestions
- `@coderabbitai security` - Focus on security issues

## ⚙️ Configuration Details

### Review Focus Areas
```yaml
quality:
  focus_areas:
    - security      # High priority
    - performance   # Medium priority  
    - accessibility # High priority
    - maintainability
    - testing
```

### Path-Based Instructions
- **Components**: React patterns, TypeScript safety, accessibility
- **Services**: Security, error handling, API best practices
- **Tests**: Coverage, reliability, mocking strategies
- **Styles**: Responsive design, accessibility, performance

## 🔧 Customization

### Modifying Review Instructions
Edit `.coderabbit.yaml` to:
- Add new file path patterns
- Modify review instructions
- Change focus areas
- Update exclusion patterns

### Example Customization
```yaml
reviews:
  path_instructions:
    - path: "src/custom/**/*.tsx"
      instructions: |
        Review custom components for:
        - Specific design system compliance
        - Custom hook usage patterns
        - Performance optimization
```

## 📊 Benefits for Ultron

### Code Quality
- Consistent React/TypeScript patterns
- Early bug detection
- Performance optimization suggestions

### Security  
- Prevents secret exposure
- Identifies security vulnerabilities
- Secure coding practice enforcement

### Team Efficiency
- Automated first-pass reviews
- Consistent feedback across PRs
- Reduced manual review time

### Learning
- Best practice suggestions
- Educational feedback
- Continuous improvement

## 🎯 Next Steps

1. **Create a Test PR**: Make a small change to test CodeRabbit
2. **Review Feedback**: See CodeRabbit's analysis in action
3. **Customize**: Adjust `.coderabbit.yaml` based on team needs
4. **Train Team**: Share this guide with contributors

## 🆘 Troubleshooting

### CodeRabbit Not Reviewing
- Check GitHub App permissions
- Verify repository access in CodeRabbit dashboard
- Ensure PR has code changes (not just docs)

### Incomplete Reviews
- Check `.coderabbit.yaml` syntax
- Verify file paths in configuration
- Review exclusion patterns

### Getting Help
- Use `@coderabbitai help` in PR comments
- Check [CodeRabbit Documentation](https://docs.coderabbit.ai)
- Contact CodeRabbit support

---

**Ready to go!** CodeRabbit will automatically review your next pull request with AI-powered insights tailored for the Ultron codebase. 🚀
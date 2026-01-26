# Contributing to ArchiGram.ai

First off, thank you for considering contributing to ArchiGram.ai! It's people like you that make ArchiGram.ai such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- A Gemini API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Development Setup

1. **Fork the repository**

   Click the "Fork" button at the top right of this page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/archigram.ai.git
   cd archigram.ai
   ```

3. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- A clear, descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (browser, OS, etc.)

Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Features

We love feature suggestions! Please use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

**Good feature requests include:**
- A clear use case
- Why existing features don't solve the problem
- Potential implementation approach (optional)

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Help improve our docs

### Pull Requests

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add comments where necessary
   - Update documentation if needed

3. **Test your changes**
   ```bash
   bun run build
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use our PR template
   - Link any related issues
   - Describe your changes clearly

## Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all props and state
- Avoid `any` type - use `unknown` if truly needed
- Use meaningful variable and function names

```typescript
// Good
interface DiagramProps {
  code: string;
  theme: Theme;
  onRender: (svg: string) => void;
}

// Avoid
interface Props {
  c: string;
  t: any;
  cb: Function;
}
```

### React

- Use functional components with hooks
- Keep components small and focused
- Use React.memo for expensive renders
- Prefer composition over prop drilling

```typescript
// Good
const DiagramPreview: React.FC<DiagramProps> = ({ code, theme }) => {
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    renderDiagram(code, theme).then(setSvg);
  }, [code, theme]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default React.memo(DiagramPreview);
```

### CSS / Tailwind

- Use Tailwind utility classes
- Extract repeated patterns to components
- Follow mobile-first responsive design
- Use CSS variables for theming

```tsx
// Good
<button className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors">
  Save
</button>
```

### File Organization

```
components/
  ComponentName/
    index.tsx        # Main component
    ComponentName.test.tsx  # Tests (when added)
    types.ts         # Component-specific types
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(ai): add support for sequence diagram generation
fix(editor): resolve cursor jumping issue on paste
docs(readme): update installation instructions
refactor(sidebar): extract project list to separate component
```

## Pull Request Process

1. **Before submitting:**
   - Ensure your code builds without errors
   - Update the README if needed
   - Add yourself to CONTRIBUTORS.md (if it exists)

2. **PR title format:**
   ```
   feat: add dark mode support
   fix: resolve memory leak in diagram renderer
   ```

3. **PR description should include:**
   - What changes were made
   - Why the changes were made
   - How to test the changes
   - Screenshots for UI changes

4. **Review process:**
   - At least one maintainer approval required
   - All CI checks must pass
   - Resolve all review comments

5. **After merge:**
   - Delete your branch
   - Celebrate! 🎉

## Recognition

Contributors are recognized in:
- GitHub contributors list
- README acknowledgments
- Release notes

Thank you for contributing to ArchiGram.ai! 🚀

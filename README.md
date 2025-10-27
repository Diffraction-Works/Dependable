# Dependable

> A comprehensive dependency health monitoring tool to keep your projects secure and up-to-date.

## Status: Under Development

Dependable is currently in active development. Star and watch this repository to stay updated on our progress.

## Overview

Dependable scans your project dependencies and provides detailed health reports to help you maintain secure, up-to-date, and compatible dependencies. Stop worrying about outdated packages, security vulnerabilities, or license compatibility issues - Dependable has you covered.

## Key Features

- **Security Vulnerability Detection**: Identify and prioritize security vulnerabilities in your dependencies
- **Maintenance Status Tracking**: Know which dependencies are actively maintained vs abandoned
- **License Compatibility Analysis**: Ensure all dependencies have compatible licenses for your project
- **Bundle Size Impact**: Understand how dependencies affect your application's size
- **Automated Update Recommendations**: Get smart update suggestions with compatibility risk assessments
- **Dependency Visualization**: See your dependency graph with health indicators
- **CI/CD Integration**: Automate dependency health checks in your pipeline

## Roadmap

- [x] Core scanning engine
- [x] Security vulnerability detection
- [ ] License compatibility analysis
- [ ] Maintenance status tracking
- [ ] Bundle size impact analysis
- [ ] Update recommendation system
- [x] CLI interface
- [ ] Web dashboard
- [ ] CI/CD integrations
- [ ] Plugin system for custom rules

## Getting Started

To get started with Dependable, follow these steps:

1.  **Download the Latest Release:**
    *   Go to the [Releases page](https://github.com/your-username/dependable/releases) of this repository (replace `your-username/dependable` with the actual repository path).
    *   Download the `Source code (zip)` or `Source code (tar.gz)` for the latest release (e.g., `v1.0.0`).
    *   Extract the contents of the downloaded archive to your desired project directory.

2.  **Install Dependencies:**
    Navigate to the extracted project directory in your terminal and install the necessary Node.js dependencies:
    ```bash
    npm install
    ```

3.  **Run Dependable:**
    Execute the tool using Node.js:
    ```bash
    node index.js
    ```
    Dependable will then analyze your project's `package.json` for dependencies, check for security vulnerabilities, and identify outdated packages, presenting a comprehensive health report in your console.

4.  **Output Formats (New!):
    Dependable now supports different output formats. Use the `--format` flag to specify your desired output:
    *   **Console (Default):** `node index.js`
    *   **Markdown:** `node index.js --format markdown`
    *   **JSON:** `node index.js --format json`

    When using `markdown` or `json` formats, the output will be printed to `stdout`, allowing you to easily pipe it to a file or another command.

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/dependable.git

# Install dependencies
cd dependable
npm install

# Run tests
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## Contact

Questions? Suggestions? Feel free to open an issue or reach out to the maintainers.



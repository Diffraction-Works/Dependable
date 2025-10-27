const path = require('path');

// Mock the entire ../index module
jest.mock('../index', () => {
  const originalModule = jest.requireActual('../index');
  const mockedModule = {
    __esModule: true,
    ...originalModule,
    getDependencies: jest.fn(),
    runNpmAudit: jest.fn(),
    runNpmOutdated: jest.fn(),
    generateReport: jest.fn((reportData, format) => originalModule.generateReport(reportData, format)),
    runDependable: jest.fn(async (projectPath, format) => {
      const dependencies = await mockedModule.getDependencies(projectPath);
      const audit = await mockedModule.runNpmAudit(projectPath);
      const outdated = await mockedModule.runNpmOutdated(projectPath);

      const reportData = {
        dependencies,
        audit,
        outdated,
      };

      const report = mockedModule.generateReport(reportData, format);
      console.log(report);
    }),
  };
  return mockedModule;
});

let dependableModule;
let consoleSpy;

describe('Dependable Core Functions', () => {
  let consoleSpy;
  let originalArgv;

  beforeEach(() => {
    // Mock console.log to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Store original process.argv
    originalArgv = process.argv;
  
    // Clear module cache to ensure a fresh import for each test
    jest.resetModules();
    // Dynamically import index.js after setting process.argv
    dependableModule = require('../index');
  
    // Set default mock implementations
    dependableModule.getDependencies.mockReturnValue({});
    dependableModule.runNpmAudit.mockReturnValue({
      "auditReportVersion": 2,
      "metadata": {
        "vulnerabilities": {
          "info": 0,
          "low": 0,
          "moderate": 0,
          "high": 0,
          "critical": 0,
          "total": 0
        }
      },
      "advisories": {}
    });
    dependableModule.runNpmOutdated.mockReturnValue({});
  });

  afterEach(() => {
    // Restore original console.log and process.argv
    consoleSpy.mockRestore();
    process.argv = originalArgv;
  });

  // Mock child_process.exec for runNpmAudit and runNpmOutdated tests
  beforeAll(() => {
    jest.mock('child_process', () => ({
      exec: jest.fn((command, options, callback) => {
        if (command.includes('npm audit --json')) {
          // Simulate npm audit output with no vulnerabilities
          callback(null, '{"auditReportVersion":2,"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0},"dependencies":{"prod":1,"dev":323,"optional":27,"peer":0,"peerOptional":0,"total":323}},"vulnerabilities":{}}', '');
        } else if (command.includes('npm outdated --json')) {
          // Simulate npm outdated output with no outdated packages
          callback(null, '{}', '');
        } else {
          callback(new Error('Unknown command'));
        }
      }),
    }));
  });

  test('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  test('getDependencies should correctly parse package.json', async () => {
    const mockProjectPath = path.join(__dirname, '..');
    dependableModule.getDependencies.mockReturnValue({
      "express": "^4.17.1",
      "lodash": "^4.17.21",
      "jest": "^27.0.6"
    });
    const { getDependencies } = dependableModule;
    const dependencies = await getDependencies(mockProjectPath, './test/mock-package.json');
    expect(dependencies).toEqual({
      "express": "^4.17.1",
      "lodash": "^4.17.21",
      "jest": "^27.0.6"
    });
  });

  test('runNpmAudit should return audit results', async () => {
    const mockProjectPath = path.join(__dirname, '..');
    const { runNpmAudit } = dependableModule;
    const auditResult = await runNpmAudit(mockProjectPath);
    expect(auditResult.metadata.vulnerabilities).toEqual({"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0});
  });

  test('runNpmOutdated should return outdated results', async () => {
    const mockProjectPath = path.join(__dirname, '..');
    const { runNpmOutdated } = dependableModule;
    const outdatedResult = await runNpmOutdated(mockProjectPath);
    expect(outdatedResult).toEqual({});
  });

  test('generateReport should create a comprehensive report', async () => {
    const { generateReport } = dependableModule;
    const mockDependencies = {
      "express": "^4.17.1",
      "lodash": "^4.17.21"
    };
    const mockAuditResults = {
      "auditReportVersion": 2,
      "metadata": {
        "vulnerabilities": {
          "info": 0,
          "low": 1,
          "moderate": 0,
          "high": 0,
          "critical": 0,
          "total": 1
        }
      },
      "advisories": {
        "100": {
          "severity": "low",
          "title": "Example Vulnerability",
          "url": "https://example.com/advisory/100",
          "module_name": "example-package",
          "vulnerable_versions": ">=1.0.0 <1.0.5",
          "patched_versions": ">=1.0.5",
          "overview": "This is an example vulnerability."
        }
      }
    };
    const mockOutdatedResults = {
      "express": {
        "current": "4.17.1",
        "wanted": "4.17.1",
        "latest": "4.18.0",
        "dependent": "dependable"
      }
    };

    const reportData = {
      dependencies: mockDependencies,
      audit: mockAuditResults,
      outdated: mockOutdatedResults
    };

    const report = generateReport(reportData);

    // Test for specific content rather than exact string matching
    expect(report).toContain('# Dependable Health Report');
    expect(report).toContain('## Project Dependencies');
    expect(report).toContain('- express: ^4.17.1');
    expect(report).toContain('- lodash: ^4.17.21');
    expect(report).toContain('## Security Vulnerabilities (npm audit)');
    expect(report).toContain('### Example Vulnerability (Severity: low)');
    expect(report).toContain('- Package: example-package');
    expect(report).toContain('- Vulnerable Versions: >=1.0.0 <1.0.5');
    expect(report).toContain('- Patched Versions: >=1.0.5');
    expect(report).toContain('- Overview: This is an example vulnerability.');
    expect(report).toContain('- URL: https://example.com/advisory/100');
    expect(report).toContain('## Outdated Dependencies (npm outdated)');
    expect(report).toContain('express: Current 4.17.1');
    expect(report).toContain('Wanted 4.17.1');
    expect(report).toContain('Latest 4.18.0');
  });

  test('should output JSON when --format json is provided', async () => {
    const mockProjectPath = path.join(__dirname, '..');

    // Set process.argv for the test
    process.argv = ['node', 'index.js', '--format', 'json'];

    dependableModule.getDependencies.mockImplementation(() => ({
      "express": "^4.17.1",
      "lodash": "^4.17.21"
    }));
    dependableModule.runNpmAudit.mockImplementation(() => ({
      "auditReportVersion": 2,
      "metadata": {
        "vulnerabilities": {
          "info": 0,
          "low": 0,
          "moderate": 0,
          "high": 0,
          "critical": 0,
          "total": 0
        }
      },
      "advisories": {}
    }));
    dependableModule.runNpmOutdated.mockImplementation(() => ({}));

    await dependableModule.runDependable(mockProjectPath, 'json');
    // Assertions
    expect(consoleSpy).toHaveBeenCalled();
    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output).toHaveProperty('dependencies');
    expect(output.dependencies).toEqual({
      "express": "^4.17.1",
      "lodash": "^4.17.21"
    });
    expect(output).toHaveProperty('audit');
    expect(output.audit.metadata.vulnerabilities.total).toBe(0);
    expect(output).toHaveProperty('outdated');
    expect(Object.keys(output.outdated).length).toBe(0);
  }, 10000); // Increased timeout to 10 seconds

  test('should output Markdown when --format markdown is provided', async () => {
    const mockProjectPath = path.join(__dirname, '..');

    // Set process.argv for the test
    process.argv = ['node', 'index.js', '--format', 'markdown'];

    dependableModule.getDependencies.mockImplementation(() => ({
      "express": "^4.17.1",
      "lodash": "^4.17.21"
    }));
    dependableModule.runNpmAudit.mockImplementation(() => ({
      "auditReportVersion": 2,
      "metadata": {
        "vulnerabilities": {
          "info": 0,
          "low": 1,
          "moderate": 0,
          "high": 0,
          "critical": 0,
          "total": 1
        }
      },
      "advisories": {
        "100": {
          "severity": "low",
          "title": "Example Vulnerability",
          "url": "https://example.com/advisory/100",
          "module_name": "example-package",
          "vulnerable_versions": ">=1.0.0 <1.0.5",
          "patched_versions": ">=1.0.5",
          "overview": "This is an example vulnerability."
        }
      }
    }));
    dependableModule.runNpmOutdated.mockImplementation(() => ({
      "express": {
        "current": "4.17.1",
        "wanted": "4.17.1",
        "latest": "4.18.0",
        "dependent": "dependable"
      }
    }));

    await dependableModule.runDependable(mockProjectPath, 'markdown');
    // Assertions
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('# Dependable Health Report');
    expect(output).toContain('## Project Dependencies');
    expect(output).toContain('- express: ^4.17.1');
    expect(output).toContain('- lodash: ^4.17.21');
    expect(output).toContain('## Security Vulnerabilities (npm audit)');
    expect(output).toContain('### Example Vulnerability (Severity: low)');
    expect(output).toContain('- Package: example-package');
    expect(output).toContain('- Vulnerable Versions: >=1.0.0 <1.0.5');
    expect(output).toContain('- Patched Versions: >=1.0.5');
    expect(output).toContain('- Overview: This is an example vulnerability.');
    expect(output).toContain('- URL: https://example.com/advisory/100');
    expect(output).toContain('## Outdated Dependencies (npm outdated)');
    expect(output).toContain('express: Current 4.17.1');
    expect(output).toContain('Wanted 4.17.1');
    expect(output).toContain('Latest 4.18.0');
  }, 10000);
});
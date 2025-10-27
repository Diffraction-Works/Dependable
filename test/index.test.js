const path = require('path');
const { getDependencies, runNpmAudit, runNpmOutdated, generateReport, exec } = require('../index');

describe('Dependable Core Functions', () => {
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
    const dependencies = await getDependencies(mockProjectPath, './test/mock-package.json');
    expect(dependencies).toEqual({
      "express": "^4.17.1",
      "lodash": "^4.17.21",
      "jest": "^27.0.6"
    });
  });

  test('runNpmAudit should return audit results', async () => {
    const mockProjectPath = path.join(__dirname, '..');
    const auditResult = await runNpmAudit(mockProjectPath);
    expect(auditResult.metadata.vulnerabilities).toEqual({"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0});
  });

  test('runNpmOutdated should return outdated results', async () => {
    const mockProjectPath = path.join(__dirname, '..');
    const outdatedResult = await runNpmOutdated(mockProjectPath);
    expect(outdatedResult).toEqual({});
  });

  test('generateReport should create a comprehensive report', async () => {
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
          "url": "https://example.com/advisory/100"
        }
      }
    };
    const mockOutdatedResults = {
      "express": {
        "current": "4.17.1",
        "latest": "4.18.0",
        "dependent": "dependable"
      }
    };

    const report = generateReport(mockDependencies, mockAuditResults, mockOutdatedResults);

    // Test for specific content rather than exact string matching
    expect(report).toContain('# Dependable Health Report');
    expect(report).toContain('## Project Dependencies');
    expect(report).toContain('- express: ^4.17.1');
    expect(report).toContain('- lodash: ^4.17.21');
    expect(report).toContain('## Security Vulnerabilities (npm audit)');
    expect(report).toContain('Example Vulnerability');
    expect(report).toContain('Severity: low');
    expect(report).toContain('https://example.com/advisory/100');
    expect(report).toContain('## Outdated Dependencies (npm outdated)');
    expect(report).toContain('express: Current 4.17.1');
    expect(report).toContain('Latest 4.18.0');
  });
});
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Add a new module for argument parsing
const minimist = require('minimist');

// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// Export exec for testing purposes
module.exports.exec = exec;

function getDependencies(projectPath, packageJsonFileName = 'package.json') {
  const packageJsonPath = path.join(projectPath, packageJsonFileName);
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Error: package.json not found at ${packageJsonPath}`);
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    return { ...dependencies, ...devDependencies };
  } catch (error) {
    console.error(`Error parsing package.json: ${error.message}`);
    return null;
  }
}

async function runDependable(projectRoot, outputFormat = 'console') {
  if (outputFormat === 'console') {
    console.log('Dependable is running!');
  }

  // const projectRoot = process.cwd(); // Removed this line
  const projectDependencies = getDependencies(projectRoot);

  if (projectDependencies) {
    if (outputFormat === 'console') {
      console.log('Project Dependencies:', projectDependencies);
    }

    try {
      const auditResult = await runNpmAudit(projectRoot);
      const { total, critical, high, moderate, low } = auditResult.metadata.vulnerabilities;
      let auditColor = colors.green;
      if (critical > 0 || high > 0) {
        auditColor = colors.red;
      } else if (moderate > 0) {
        auditColor = colors.yellow;
      }
      if (outputFormat === 'console') {
        console.log(`${auditColor}NPM Audit Summary: Total: ${total}, Critical: ${critical}, High: ${high}, Moderate: ${moderate}, Low: ${low}${colors.reset}`);
      }

      const outdatedResult = await runNpmOutdated(projectRoot);
      const outdatedCount = Object.keys(outdatedResult).length;
      const outdatedColor = outdatedCount > 0 ? colors.yellow : colors.green;
      if (outputFormat === 'console') {
        console.log(`${outdatedColor}NPM Outdated Summary: Total outdated packages: ${outdatedCount}${colors.reset}`);
      }

      const reportData = {
        dependencies: projectDependencies,
        audit: auditResult,
        outdated: outdatedResult
      };

      switch (outputFormat) {
        case 'json':
          console.log(generateReport(reportData, 'json'));
          break;
        case 'markdown':
          console.log(generateReport(reportData, 'markdown'));
          break;
        case 'console':
        default:
          console.log('\n' + generateReport(reportData, 'markdown'));
          break;
      }
    } catch (error) {
      console.error('Dependable encountered an error:', error);
    }
  } else {
    console.error('Could not retrieve project dependencies. Exiting.');
  }
}

// Main entry point for Dependable
if (require.main === module) {
  const projectRoot = process.cwd();
  const args = minimist(process.argv.slice(2));
  const outputFormat = args.format || 'console'; // Default to console output
  runDependable(projectRoot, outputFormat);
}

function runNpmAudit(projectPath) {
  return new Promise((resolve, reject) => {
    exec('npm audit --json', { cwd: projectPath }, (error, stdout, stderr) => {
      if (error) {
        // npm audit exits with a non-zero code if vulnerabilities are found, but we still want the output
        // console.error(`npm audit error: ${error.message}`);
        // It's important to still parse stdout even if there's an error
      }
      if (stderr) {
        console.error(`npm audit stderr: ${stderr}`);
      }
      try {
        const auditResult = JSON.parse(stdout);
        resolve(auditResult);
      } catch (parseError) {
        console.error(`Error parsing npm audit output: ${parseError.message}`);
        reject(parseError);
      }
    });
  });
}

function runNpmOutdated(projectPath) {
  return new Promise((resolve, reject) => {
    exec('npm outdated --json', { cwd: projectPath }, (error, stdout, stderr) => {
      if (error) {
        // npm outdated exits with a non-zero code if outdated packages are found
        // We still want to parse the stdout
      }
      if (stderr) {
        console.error(`npm outdated stderr: ${stderr}`);
      }
      try {
        const outdatedResult = JSON.parse(stdout);
        resolve(outdatedResult);
      } catch (parseError) {
        console.error(`Error parsing npm outdated output: ${parseError.message}`);
        reject(parseError);
      }
    });
  });
}

function generateReport(data, format = 'markdown') {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  const { dependencies, audit, outdated } = data;
  let report = '# Dependable Health Report\n\n';

  report += '## Project Dependencies\n';
  if (dependencies && Object.keys(dependencies).length > 0) {
    for (const dep in dependencies) {
      report += `- ${dep}: ${dependencies[dep]}\n`;
    }
  } else {
    report += 'No dependencies found.\n';
  }
  report += '\n';

  report += '## Security Vulnerabilities (npm audit)\n';
  if (audit && audit.advisories && Object.keys(audit.advisories).length > 0) {
    for (const advisoryId in audit.advisories) {
      const advisory = audit.advisories[advisoryId];
      report += `### ${advisory.title} (Severity: ${advisory.severity})\n`;
      report += `- Package: ${advisory.module_name}\n`;
      report += `- Vulnerable Versions: ${advisory.vulnerable_versions}\n`;
      report += `- Patched Versions: ${advisory.patched_versions}\n`;
      report += `- Overview: ${advisory.overview}\n`;
      report += `- URL: ${advisory.url}\n\n`;
    }
  } else {
    report += 'No security vulnerabilities found.\n';
  }
  report += '\n';

  report += '## Outdated Dependencies (npm outdated)\n';
  if (outdated && Object.keys(outdated).length > 0) {
    for (const dep in outdated) {
      const info = outdated[dep];
      report += `- ${dep}: Current ${info.current}, Wanted ${info.wanted}, Latest ${info.latest}\n`;
    }
  } else {
    report += 'No outdated dependencies found.\n';
  }
  report += '\n';

  return report;
}

module.exports = {
  getDependencies,
  runNpmAudit,
  runNpmOutdated,
  generateReport,
  runDependable
};
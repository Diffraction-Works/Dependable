#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function getDependencies(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
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

// Main entry point for Dependable

console.log("Dependable is running!");

const projectRoot = process.cwd(); // Assuming Dependable is run from the project root
const projectDependencies = getDependencies(projectRoot);

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

function generateReport(dependencies, auditResults, outdatedResults) {
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
  if (auditResults && auditResults.advisories && Object.keys(auditResults.advisories).length > 0) {
    for (const advisoryId in auditResults.advisories) {
      const advisory = auditResults.advisories[advisoryId];
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
  if (outdatedResults && Object.keys(outdatedResults).length > 0) {
    for (const dep in outdatedResults) {
      const info = outdatedResults[dep];
      report += `- ${dep}: Current ${info.current}, Wanted ${info.wanted}, Latest ${info.latest}\n`;
    }
  } else {
    report += 'No outdated dependencies found.\n';
  }
  report += '\n';

  return report;
}

if (projectDependencies) {
  console.log('Project Dependencies:', projectDependencies);

  runNpmAudit(projectRoot)
    .then(auditResult => {
      console.log('NPM Audit Results:', auditResult);

      runNpmOutdated(projectRoot)
        .then(outdatedResult => {
          console.log('NPM Outdated Results:', outdatedResult);
          const report = generateReport(projectDependencies, auditResult, outdatedResult);
          console.log('\n' + report);
        })
        .catch(error => {
          console.error('Failed to run npm outdated:', error);
        });
    })
    .catch(error => {
      console.error('Failed to run npm audit:', error);
    });
} else {
  console.log('Could not retrieve project dependencies.');
}



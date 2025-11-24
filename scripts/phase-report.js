#!/usr/bin/env node

/**
 * Phase Progress Report Generator
 *
 * Generates a detailed, colorful CLI report of project progress
 * with phase breakdowns, blockers, and next actions.
 *
 * Usage:
 *   node scripts/phase-report.js
 *   npm run phase-report
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PROGRESS_FILE = path.join(ROOT_DIR, 'PROGRESS.md');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
};

// Helper functions
function color(text, colorCode) {
  return `${colorCode}${text}${colors.reset}`;
}

function bold(text) {
  return `${colors.bright}${text}${colors.reset}`;
}

function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const phases = [];
  let currentPhase = null;
  let inPhaseSection = false;

  for (const line of lines) {
    // Detect phase headers (## Phase X)
    const phaseMatch = line.match(/^## (Phase \d+(?:\.\d+)? — .+)$/);
    if (phaseMatch) {
      if (currentPhase) phases.push(currentPhase);

      currentPhase = {
        title: phaseMatch[1],
        tasks: [],
        duration: null,
        deliverables: [],
      };
      inPhaseSection = true;
      continue;
    }

    // Detect next major section (end of phase)
    if (line.startsWith('##') && !line.includes('Phase')) {
      if (currentPhase) {
        phases.push(currentPhase);
        currentPhase = null;
      }
      inPhaseSection = false;
      continue;
    }

    if (inPhaseSection && currentPhase) {
      // Extract duration
      const durationMatch = line.match(/\*\*Duration:\*\* (.+?) \|/);
      if (durationMatch) {
        currentPhase.duration = durationMatch[1];
      }

      // Extract progress
      const progressMatch = line.match(/\*\*Progress:\*\* (\d+)% \((\d+)\/(\d+)\)/);
      if (progressMatch) {
        currentPhase.progress = parseInt(progressMatch[1]);
        currentPhase.completed = parseInt(progressMatch[2]);
        currentPhase.total = parseInt(progressMatch[3]);
      }

      // Extract tasks
      const taskMatch = line.match(/^- \[([x ])\] (.+)$/);
      if (taskMatch) {
        currentPhase.tasks.push({
          done: taskMatch[1] === 'x',
          name: taskMatch[2],
        });
      }

      // Extract deliverables
      if (line.includes('✅ Phase') && line.includes('Complete:')) {
        const deliverable = line.replace(/^- \[.\] /, '').replace('✅', '').trim();
        currentPhase.deliverables.push(deliverable);
      }
    }
  }

  if (currentPhase) phases.push(currentPhase);

  return phases;
}

function getOverallStats(markdown) {
  const overallMatch = markdown.match(/📊 \*\*Overall Progress:\*\* (\d+)% Complete \((\d+)\/(\d+) tasks\)/);
  if (overallMatch) {
    return {
      percentage: parseInt(overallMatch[1]),
      completed: parseInt(overallMatch[2]),
      total: parseInt(overallMatch[3]),
    };
  }
  return { percentage: 0, completed: 0, total: 0 };
}

function getCurrentPhase(phases) {
  // Find first phase that's not complete
  for (const phase of phases) {
    if (phase.progress < 100) {
      return phase;
    }
  }
  return phases[phases.length - 1]; // Return last phase if all complete
}

function getNextActions(currentPhase) {
  // Return first 3 incomplete tasks
  return currentPhase.tasks.filter(t => !t.done).slice(0, 3);
}

function getBlockers(phases) {
  // Placeholder - would check for actual blockers in a real implementation
  // For now, return empty array
  return [];
}

function printHeader() {
  console.log('\n');
  console.log(color('═'.repeat(70), colors.cyan));
  console.log(color('  🚀 KANBAN PROJECT PROGRESS REPORT', colors.cyan + colors.bright));
  console.log(color('═'.repeat(70), colors.cyan));
  console.log('\n');
}

function printOverallProgress(stats) {
  console.log(bold('📊 OVERALL PROGRESS'));
  console.log(color('─'.repeat(70), colors.dim));

  const barLength = 40;
  const filledLength = Math.round((stats.percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;

  let barColor = colors.red;
  if (stats.percentage >= 80) barColor = colors.green;
  else if (stats.percentage >= 40) barColor = colors.yellow;

  const bar = color('█'.repeat(filledLength), barColor) + color('░'.repeat(emptyLength), colors.dim);

  console.log(`\n  ${bar} ${bold(stats.percentage + '%')}`);
  console.log(`\n  ${color('Completed:', colors.green)} ${stats.completed}/${stats.total} tasks`);
  console.log('\n');
}

function printPhasesSummary(phases) {
  console.log(bold('📋 PHASES SUMMARY'));
  console.log(color('─'.repeat(70), colors.dim));
  console.log('');

  phases.forEach((phase, index) => {
    const phaseNum = phase.title.match(/Phase [\d.]+/)[0];
    const phaseName = phase.title.split(' — ')[1];

    let statusIcon = '🔴';
    let statusText = 'Not Started';
    let statusColor = colors.red;

    if (phase.progress === 100) {
      statusIcon = '🟢';
      statusText = 'Complete';
      statusColor = colors.green;
    } else if (phase.progress > 0) {
      statusIcon = '🟡';
      statusText = 'In Progress';
      statusColor = colors.yellow;
    }

    console.log(
      `  ${statusIcon} ${bold(phaseNum)} ${phaseName}`
    );
    console.log(
      `     ${color(statusText, statusColor)} • ` +
      `${phase.progress}% (${phase.completed}/${phase.total}) • ` +
      `${color(phase.duration, colors.dim)}`
    );

    if (index < phases.length - 1) console.log('');
  });

  console.log('\n');
}

function printCurrentPhase(phase) {
  console.log(bold('🎯 CURRENT PHASE'));
  console.log(color('─'.repeat(70), colors.dim));
  console.log('');

  const phaseNum = phase.title.match(/Phase [\d.]+/)[0];
  const phaseName = phase.title.split(' — ')[1];

  console.log(`  ${color(phaseNum, colors.cyan + colors.bright)}: ${phaseName}`);
  console.log(`  ${color('Duration:', colors.dim)} ${phase.duration}`);
  console.log(`  ${color('Progress:', colors.dim)} ${phase.progress}% (${phase.completed}/${phase.total} tasks)`);

  if (phase.deliverables.length > 0) {
    console.log(`\n  ${color('Deliverables:', colors.magenta)}`);
    phase.deliverables.forEach(d => {
      console.log(`    • ${d}`);
    });
  }

  console.log('\n');
}

function printNextActions(actions) {
  console.log(bold('⚡ NEXT ACTIONS'));
  console.log(color('─'.repeat(70), colors.dim));
  console.log('');

  if (actions.length === 0) {
    console.log(color('  🎉 All tasks in current phase complete!', colors.green));
  } else {
    actions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.name}`);
    });
  }

  console.log('\n');
}

function printBlockers(blockers) {
  if (blockers.length === 0) return;

  console.log(bold('⚠️  BLOCKERS'));
  console.log(color('─'.repeat(70), colors.dim));
  console.log('');

  blockers.forEach(blocker => {
    console.log(`  ${color('!', colors.red)} ${blocker}`);
  });

  console.log('\n');
}

function printTaskBreakdown(phase) {
  console.log(bold('📝 TASK BREAKDOWN'));
  console.log(color('─'.repeat(70), colors.dim));
  console.log('');

  const completed = phase.tasks.filter(t => t.done);
  const pending = phase.tasks.filter(t => !t.done);

  console.log(color('  Completed:', colors.green));
  if (completed.length === 0) {
    console.log(color('    None yet', colors.dim));
  } else {
    completed.slice(0, 5).forEach(task => {
      console.log(`    ✓ ${task.name}`);
    });
    if (completed.length > 5) {
      console.log(color(`    ... and ${completed.length - 5} more`, colors.dim));
    }
  }

  console.log('');
  console.log(color('  Pending:', colors.yellow));
  if (pending.length === 0) {
    console.log(color('    All tasks complete! 🎉', colors.green));
  } else {
    pending.slice(0, 8).forEach(task => {
      console.log(`    ○ ${task.name}`);
    });
    if (pending.length > 8) {
      console.log(color(`    ... and ${pending.length - 8} more`, colors.dim));
    }
  }

  console.log('\n');
}

function printFooter() {
  const timestamp = new Date().toLocaleString();
  console.log(color('─'.repeat(70), colors.dim));
  console.log(color(`  Generated: ${timestamp}`, colors.dim));
  console.log(color('  Run `npm run check-progress` to update progress', colors.dim));
  console.log(color('═'.repeat(70), colors.cyan));
  console.log('\n');
}

// Main function
function main() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.error(color('❌ PROGRESS.md not found!', colors.red));
    process.exit(1);
  }

  const markdown = fs.readFileSync(PROGRESS_FILE, 'utf8');
  const phases = parseMarkdown(markdown);
  const overall = getOverallStats(markdown);
  const currentPhase = getCurrentPhase(phases);
  const nextActions = getNextActions(currentPhase);
  const blockers = getBlockers(phases);

  printHeader();
  printOverallProgress(overall);
  printPhasesSummary(phases);
  printCurrentPhase(currentPhase);
  printNextActions(nextActions);
  printBlockers(blockers);
  printTaskBreakdown(currentPhase);
  printFooter();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseMarkdown, getOverallStats, getCurrentPhase };

#!/usr/bin/env node

const simpleGit = require('simple-git');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

const git = simpleGit();
const tempDir = os.tmpdir();
const commitLogPath = path.join(tempDir, 'commit-log.json');
const featuresPath = path.join(tempDir, 'features.json');

// Helper function to read commit log
const readCommitLog = () => {
  try {
    const data = fs.readFileSync(commitLogPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// Helper function to write commit log
const writeCommitLog = (log) => {
  fs.writeFileSync(commitLogPath, JSON.stringify(log, null, 2), 'utf8');
};

// Helper function to read features
const readFeatures = () => {
  try {
    const data = fs.readFileSync(featuresPath, 'utf8');
    return JSON.parse(data).features;
  } catch (error) {
    return [];
  }
};

// Helper function to write features
const writeFeatures = (features) => {
  const data = { features: features };
  fs.writeFileSync(featuresPath, JSON.stringify(data, null, 2), 'utf8');
};

// Helper function to create pull request
const createPullRequest = async (repoOwner, repoName, headBranch, baseBranch, title, body, token) => {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  };
  const data = {
    title: title,
    head: headBranch,
    base: baseBranch,
    body: body,
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Error creating pull request: ${error.message}`);
  }
};

// Helper function to resolve conflicts during cherry-pick
const resolveCherryPickConflicts = async (git, commit) => {
  const inquirer = (await import('inquirer')).default;
  while (true) {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue after resolving the conflict:',
      },
    ]);
    break
  }
}


const main = async () => {
  const inquirer = (await import('inquirer')).default;

  yargs(hideBin(process.argv))
    .command('clone <repoUrl> <localPath>', 'Clone a repository', (yargs) => {
      yargs
        .positional('repoUrl', {
          describe: 'Repository URL',
          type: 'string'
        })
        .positional('localPath', {
          describe: 'Local path to clone the repository',
          type: 'string'
        });
    }, async (argv) => {
      try {
        const result = await git.clone(argv.repoUrl, argv.localPath);
        console.log(result);
        console.log('Repository cloned successfully');
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('commit <message>', 'Commit changes', (yargs) => {
      yargs
        .option('message', {
          alias: 'm',
          describe: 'Commit message',
          type: 'string',
          demandOption: true
        });
    }, async (argv) => {
      try {
        const result = await git.commit(argv.message);
        console.log(result);
        console.log('[master (root-commit) abc1234] ' + argv.message);
        console.log('1 file changed, 1 insertion(+)');
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('push <origin> <branch>', 'Push changes', (yargs) => {
      yargs
        .positional('origin', {
          describe: 'Remote repository name',
          type: 'string'
        })
        .positional('branch', {
          describe: 'Branch name',
          type: 'string'
        });
    }, async (argv) => {
      try {
        const features = readFeatures();
        const { feature } = await inquirer.prompt([
          {
            type: 'list',
            name: 'feature',
            message: 'Select a feature to push:',
            choices: features,
          },
        ]);

        const result = await git.push(argv.origin, argv.branch);
        console.log(result);
        console.log('To ' + argv.origin);
        console.log(' * [new branch] ' + argv.branch + ' -> ' + argv.branch);
        console.log('Push successful');
        if (features.length) {
          let commitLog = readCommitLog();
          if (!commitLog[feature]) {
            commitLog[feature] = [result.update.hash.to];
          } else {
            commitLog[feature].push(result.update.hash.to)
          }
          writeCommitLog(commitLog);
        }
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('pull [origin] [branch]', 'Pull changes', (yargs) => {
      yargs
        .positional('origin', {
          describe: 'Remote repository name',
          type: 'string'
        })
        .positional('branch', {
          describe: 'Branch name',
          type: 'string'
        });
    }, async (argv) => {
      try {
        if (argv.origin && argv.branch) {
          const result = await git.pull(argv.origin, argv.branch);
          console.log(result);
          console.log('From ' + argv.origin);
          console.log(' * branch            ' + argv.branch + '     -> FETCH_HEAD');
          console.log('Pull successful');
        } else {
          const result = await git.pull();
          console.log(result);
          console.log('Pull successful');
        }
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('status', 'Show the working tree status', async () => {
      try {
        const status = await git.status();
        console.log(status);
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('log', 'Show commit logs', async () => {
      try {
        const log = await git.log();
        console.log(log);
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('help', 'Show help', () => {
      yargs.showHelp();
    })
    .command('add-feature <feature>', 'Add a new feature', (yargs) => {
      yargs
        .positional('feature', {
          describe: 'Feature name',
          type: 'string'
        });
    }, async (argv) => {
      try {
        const features = readFeatures();
        features.push(argv.feature);
        writeFeatures(features);
        console.log(`Feature "${argv.feature}" added successfully.`);
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('remove-feature', 'Remove a feature', async () => {
      try {
        const features = readFeatures();
        if (features.length === 0) {
          console.log('No features available to remove.');
          return;
        }

        const { feature } = await inquirer.prompt([
          {
            type: 'list',
            name: 'feature',
            message: 'Select a feature to remove:',
            choices: features,
          },
        ]);

        const updatedFeatures = features.filter(f => f !== feature);
        writeFeatures(updatedFeatures);
        console.log(`Feature "${feature}" removed successfully.`);
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('pwd', 'Remove a feature', async () => {
      try {
        console.log(tempDir);
      } catch (error) {
        console.error(error.message);
      }
    })
    .command('release', 'Create a release branch', async () => {
      try {
        const features = readFeatures();
        if (features.length === 0) {
          console.log('No features available to create a pull request.');
          return;
        }

        const { feature } = await inquirer.prompt([
          {
            type: 'list',
            name: 'feature',
            message: 'Select a feature to create a pull request for:',
            choices: features,
          },
        ]);

        const commitLog = readCommitLog();
        if (!commitLog[feature] || commitLog[feature].length === 0) {
          console.log(`No commits available for feature "${feature}" to create a pull request.`);
          return;
        }

        const { repoOwner, repoName, baseBranch, token } = await inquirer.prompt([
          {
            type: 'input',
            name: 'baseBranch',
            message: 'Enter the base branch to merge into:',
            default: 'main',
          }
        ]);

        const headBranch = `release-${feature}`;
        await git.checkoutLocalBranch(headBranch);
        await git.pull('origin', baseBranch);

        for (const commit of commitLog[feature]) {
          try {
            await git.raw(['cherry-pick', commit]);
          } catch (error) {
            console.log(`Conflict detected while cherry-picking commit: ${commit}`);
            await resolveCherryPickConflicts(git, commit);
          }
        }

        console.log(`feature release branch created successfully: ${headBranch} please push to repo`);
      } catch (error) {
        console.error(error.message);
      }
    })
    .help()
    .argv;
};

main();

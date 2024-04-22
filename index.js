const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;


    const { data } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    data.map(change => change.filename).map(async (file) => {
      if (file.includes('src/components')) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body: "**Bold text here**",
        });
      } else if (file.includes('src/utils')) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body: "**Bold text here**",
        });
      }
    })

  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

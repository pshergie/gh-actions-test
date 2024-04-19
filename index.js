const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const myToken = core.getInput('myToken');
    const message = core.getInput('message');
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;

    console.log('====================');
    console.log('Posting comment...');
    console.log('====================');

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

    const { data: pullRequest } = await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_number,
      body: message,
    });

    const changedFiles = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    console.log('changed files:', changedFiles);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const message = core.getInput('message');
    const myToken = core.getInput('myToken');

    const context = github.context;

    if (context.payload.pull_request == null) {
      core.setFailed('No pull request found.');
      return;
    }

    const pull_request_number = context.payload.pull_request.number;

    const octokit = github.getOctokit(myToken)
    // const new_comment = octokit.issues.createComment({
    //   ...context.repo,
    //   issue_number: pull_request_number,
    //   body: message
    // });

    const new_comment = github.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: message
    });

    // github.issues.createComment({
    //   issue_number: context.issue.number,
    //   owner: context.repo.owner,
    //   repo: context.repo.repo,
    //   body: '👋 Thanks for reporting!'
    // })

    // await octokit.rest.issues.create({
    //   issue_number: pull_request_number,
    //   repo: context.repo.repo,
    //   body: message
    // })

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: message,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

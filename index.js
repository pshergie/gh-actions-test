const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const messageShort = core.getInput('messageShort');
    const message = core.getInput('message');
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;

    const { data: comments } = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_number,
    });

    const isCommentExisting = Array.isArray(comments) && comments.some(comment => comment.user.login === 'github-actions[bot]' && comment.body.includes(messageShort))

    const { data } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    const listOfFiles = data.map(change => change.filename);

    listOfFiles.map(async (file) => {
      if (file.includes('src/components') && !!isCommentExisting) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body: message,
        });
      } else if (file.includes('src/utils') && !isCommentExisting) {
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

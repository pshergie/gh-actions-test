const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const messageComponents = core.getInput('messageComponents');
    const messageUtils = core.getInput('messageUtils');
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;

    const { data: comments } = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_number,
    });

    const isComponentsCommentExisting = !!comments.find(comment => comment.user.login === 'github-actions[bot]' && comment.body === messageComponents);
    const isUtilsCommentExisting = !!comments.find(comment => comment.user.login === 'github-actions[bot]' && comment.body === messageComponents)

    const { data } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    data.map(change => change.filename).map(async (file) => {
      if (file.includes('src/components') && !isComponentsCommentExisting) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body: message,
        });
      } else if (file.includes('src/utils') && !isUtilsCommentExisting) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body: messageUtils,
        });
      }
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

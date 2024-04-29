const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  console.log("trying...");
  try {
    const settings = core.getInput("settings").split("\n");
    console.log("PATHS", settings);
    const settingsMapped = settings.map((setting) => JSON.parse(setting));
    console.log("settingsMapped:", settingsMapped);
    const myToken = core.getInput("myToken");
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;

    const { data: comments } = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_number,
    });

    settingsMapped.map((setting) => {
      for (const [path, msg] of Object.entries(settingsMapped)) {
        console.log(`${path}: ${msg}`);
      }
    });

    // const isCommentExisting = !!comments.find(
    //   (comment) =>
    //     comment.user.login === "github-actions[bot]" &&
    //     comment.body === message,
    // );

    // if (!isCommentExisting) {
    //   await octokit.rest.issues.createComment({
    //     ...context.repo,
    //     issue_number: pull_number,
    //     body: message,
    //   });
    // }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

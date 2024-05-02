const core = require("@actions/core");
const github = require("@actions/github");
const { minimatch } = require("minimatch");

const checkDiff = (paths, diffFilesPaths) => {
  if (typeof paths === "string") {
    return diffFilesPaths.some(
      (diffPath) => diffPath.includes(paths) || minimatch(diffPath, paths),
    );
  } else if (Array.isArray(paths)) {
    return paths.some((path) =>
      diffFilesPaths.some(
        (diffPath) => diffPath.includes(path) || minimatch(diffPath, paths),
      ),
    );
  } else {
    throw new Error(
      `Wrong type for 'paths' variable. It should be either string or an array of strings but is ${typeof paths}.`,
    );
  }
};

async function run() {
  try {
    const settings = [];
    core
      .getInput("settings")
      .split("\n")
      .map((line) => {
        if (line.startsWith("paths:")) {
          settings.push({
            paths: line.split("paths: ")[1],
          });
        } else if (line.startsWith("message:")) {
          settings[settings.length - 1].message = line.split("message: ")[1];
        } else {
          settings[settings.length - 1].message += `\n${line}`;
        }
      });
    console.log("SETTINGS", settings);
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;

    const { data: comments } = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_number,
    });

    const { data: fileLists } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    const diffFilesPaths = fileLists.map((diff) => diff.filename);

    settings.map(async ({ paths, message }) => {
      let areTargetPathsChanged = checkDiff(paths, diffFilesPaths);

      if (areTargetPathsChanged) {
        const isCommentExisting = comments.some(
          (comment) =>
            comment.user.login === "github-actions[bot]" &&
            comment.body === message,
        );

        if (!isCommentExisting) {
          await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_number,
            body: message,
          });
        }
      }
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

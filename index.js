const core = require("@actions/core");
const github = require("@actions/github");
const { minimatch } = require("minimatch");

const parseMarkdown = (markdown) => {
  const result = [];

  markdown.split("\n").map((line) => {
    if (line.startsWith("paths:")) {
      result.push({
        paths: line.split("paths: ")[1],
      });
    } else if (line.startsWith("message:")) {
      result[result.length - 1].message = line.split("message: ")[1];
    } else {
      result[result.length - 1].message += `\n${line}`;
    }
  });

  return result;
};

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

const postComment = async (
  paths,
  message,
  pullNumber,
  diffFilesPaths,
  comments,
  context,
  octokit,
) => {
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
        issue_number: pullNumber,
        body: message,
      });
    }
  }
};

async function run() {
  try {
    const settings = parseMarkdown(core.getInput("settings"));
    console.log("SETTINGS", settings);
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const context = github.context;
    const pullNumber = context.payload.pull_request.number;

    const { data: comments } = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pullNumber,
    });

    const { data: fileLists } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pullNumber,
    });

    const diffFilesPaths = fileLists.map((diff) => diff.filename);

    settings.map(
      async ({ paths, message }) =>
        await postComment(
          paths,
          message,
          pullNumber,
          diffFilesPaths,
          comments,
          context,
          octokit,
        ),
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

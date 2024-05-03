const core = require("@actions/core");
const github = require("@actions/github");
const { minimatch } = require("minimatch");

const parseMarkdown = (markdown) => {
  const data = [];

  markdown.split("\n").map((line) => {
    if (line.startsWith("paths:")) {
      data.push({
        paths: line.split("paths: ")[1].split(","),
      });
    } else if (line.startsWith("message:")) {
      data[data.length - 1].message = line.split("message: ")[1];
    } else {
      data[data.length - 1].message += `\n${line}`;
    }
  });

  return data;
};

const checkDiff = (paths, diffFilesPaths) => {
  console.log("");
  console.log("paths", paths);
  console.log("diffFilesPaths", diffFilesPaths);
  console.log("");

  if (Array.isArray(paths)) {
    return paths.some((path) =>
      diffFilesPaths.some(
        (diffPath) => diffPath.includes(path) || minimatch(diffPath, path),
      ),
    );
  } else {
    throw new Error(
      `Wrong type for 'paths' variable (${typeof paths}). Make sure you followed the formatting rules.`,
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

const fetchDiffFiles = async (context, pullNumber, octokit) => {
  let data = [];
  let pagesRemaining = true;

  while (pagesRemaining) {
    const response = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number: pullNumber,
      // per_page: 100,
    });

    data.push(response.data.map((diff) => diff.filename));
    const linkHeader = response.headers.link;
    pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
  }

  return data;
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

    const diffFilesPaths = await fetchDiffFiles(context, pullNumber, octokit);

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

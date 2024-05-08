const core = require("@actions/core");
const github = require("@actions/github");
const { minimatch } = require("minimatch");
const yaml = require("js-yaml");
const fs = require("fs");

const checkDiff = (paths, diffFilesPaths) => {
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
  let page = 1;

  while (pagesRemaining) {
    const response = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number: pullNumber,
      per_page: 100,
      page,
    });

    const parsedData = response.data.map((diff) => diff.filename);
    data = [...data, ...parsedData];
    const linkHeader = response.headers.link;
    pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
    page++;
  }

  return data;
};

const fetchComments = async (context, pullNumber, octokit) => {
  let data = [];
  let pagesRemaining = true;
  let page = 1;

  while (pagesRemaining) {
    const response = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pullNumber,
      per_page: 100,
      page,
    });

    data = [...data, ...response.data];
    const linkHeader = response.headers.link;
    pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
    page++;
  }

  return data;
};

async function run() {
  try {
    const settings = yaml
      .load(fs.readFileSync("docs/checklists-data.yml", "utf8"))
      .map((config) => ({
        ...config,
        paths: config.paths.split(",").map((p) => p.trim()),
      }));
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const context = github.context;
    const pullNumber = context.payload.pull_request.number;

    const comments = await fetchComments(context, pullNumber, octokit);
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

const core = require("@actions/core");
const github = require("@actions/github");
const { minimatch } = require("minimatch");
const yaml = require("js-yaml");
const fs = require("fs");

import fetchComments from "./utils/fetchComments.js";
import fetchDiffFiles from "./utils/fetchDiffFiles.js";
import postComment from "./utils/spostComment.js";

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

const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;


    const { data } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    const listOfFiles = data.map(change => change.filename);

    listOfFiles.map(async (file) => {
      if (file.includes('src/components')) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body:
            `# Solar System Exploration, 1950s – 1960s

- [ ] Mercury
- [x] Venus
- [x] Earth (Orbit/Moon)
- [x] Mars
- [ ] Jupiter
- [ ] Saturn`,
        });
      } else if (file.includes('src/utils')) {
        await octokit.rest.issues.createComment({
          ...context.repo,
          issue_number: pull_number,
          body: "**Bold text here**",
        });
      }
    })

    // const comments = await octokit.rest.pulls.listReviewComments({
    //   ...context.repo,
    //   pull_number,
    // });

    // const pullRequest = await octokit.rest.pulls.get({
    //   ...context.repo,
    //   pull_number,
    // });

    // console.log('pullRequest:', pullRequest);

    const PRComments = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_number,
    });

    console.log('pullRequest comments:', PRComments);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run()

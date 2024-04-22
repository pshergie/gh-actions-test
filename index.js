const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken);
    const context = github.context;
    const pull_number = context.payload.pull_request.number;

    const comments = await octokit.rest.issues.listComments({
      ...context.repo,
      issue_number: pull_number,
    });

    const isCommentExisting = comments.some(comment => comment.user.login === 'github-actions[bot]' && comment.body.includes('Solar System Exploration, 1950s – 1960s'))

    console.log('pullRequest comments:', comments?.data);
    console.log('user', comments?.data[0]?.user)

    const { data } = await octokit.rest.pulls.listFiles({
      ...context.repo,
      pull_number,
    });

    const listOfFiles = data.map(change => change.filename);

    listOfFiles.map(async (file) => {
      if (file.includes('src/components') && !isCommentExisting) {
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

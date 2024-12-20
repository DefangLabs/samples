const fs = require('fs');

module.exports = async ({ github, context }) => {
    const pr_number = context.issue.number;
    const marker = '## Samples Checklist';
    
    let checklist;
    let error = false;

    try {
      // Read the checklist from the file
      checklist = fs.readFileSync('checklist.txt', 'utf8');
      checklist = checklist.trim();
      if(!checklist) {
        checklist = "✅ All good!"
      }
      else {
        error = true;
      }
    } catch (readFileError) {
      throw new Error("Could not read samples checklist from file. Please fix the issues and try again.")
    }

    try {
      // Get the current PR
      const { data: pullRequest } = await github.rest.pulls.get({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: pr_number
      });
    } catch (getPrError) {
        throw new Error ("Could not get current PR from source. Please fix the issues and try again.")
    }

    try {
      let newBody;
      const body = pullRequest.body || "";
      const markerIndex = body.indexOf(marker);

      if (markerIndex !== -1) {
          // Replace the content below the marker
          newBody = body.substring(0, markerIndex + marker.length) + "\n" + checklist;
      } else {
          // Append the checklist if the marker doesn't exist
          newBody = body + "\n" + marker + "\n" + checklist;
      }

      // Update the PR description
      await github.rest.pulls.update({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: pr_number,
          body: newBody
      });
    } catch (updatePrError) {
      throw new Error("Could not update PR description based on samples checklist. Please fix the issues and try again.")
    }

    if (error) {
      throw new Error("Incomplete samples checklist. Please fix the issues and try again.");
    }
    
}

const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const fs = require('fs');
const path = require('path');

async function run() {
	try {
		const token = core.getInput("token");
		const files = core.getInput("patterns");

		const owner = github.context.repo.owner;
		const repo = github.context.repo.repo;
		const issueNumber = github.context.issue.number;

		const globber = await glob.create(files);
		const filePaths = await globber.glob();
		
		const cwd = process.cwd();
		let total = 0;
		const rows = ["| File | Number of characters |","| --- | ---: |"];
		for (const filePath of filePaths) {
			const stats = fs.statSync(filePath);
			if (!stats.isFile()) {
				core.info(`${filePath} is not a file`);
				continue;
			}
			const content = fs.readFileSync(filePath, "utf8");
			const relativePath = path.relative(cwd, filePath);
			const charCount = content.length;
			rows.push(`| ${relativePath} | ${charCount} |`);
			total += charCount

		}
			rows.push(`| Total | ${total} |`);
		const body = rows.join("\n");
		
		const octokit = github.getOctokit(token);
		await octokit.issues.createComment({
			owner,
			repo,
			issue_number: issueNumber,
			body,

		});
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();

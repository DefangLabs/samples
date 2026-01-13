#!/usr/bin/env node
/**
 * Generate a samples list and update the main README.md.
 *
 * This script:
 * 1. Scans the samples directory for all sample projects
 * 2. Extracts metadata (Title, Description, Tags, Languages) from each README.md
 * 3. Generates a markdown table
 * 4. Updates the main README.md, replacing content between markers
 *
 * Usage:
 *     node scripts/generate-samples-list.js
 *     # or
 *     ./scripts/generate-samples-list.js
 */

const fs = require("fs");
const path = require("path");

// Markers for the auto-generated section
const START_MARKER = "<!-- SAMPLES_LIST_START -->";
const END_MARKER = "<!-- SAMPLES_LIST_END -->";

/**
 * Extract metadata from a sample README.md file.
 */
function extractMetadata(readmePath) {
  const metadata = {
    title: null,
    description: null,
    tags: null,
    languages: null,
  };

  let content;
  try {
    content = fs.readFileSync(readmePath, "utf-8");
  } catch (err) {
    console.log(`  Warning: Could not read ${readmePath}: ${err.message}`);
    return metadata;
  }

  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("Title:")) {
      metadata.title = trimmed.slice(6).trim();
    } else if (trimmed.startsWith("Short Description:")) {
      metadata.description = trimmed.slice(18).trim();
    } else if (trimmed.startsWith("Tags:")) {
      metadata.tags = trimmed.slice(5).trim();
    } else if (trimmed.startsWith("Languages:")) {
      metadata.languages = trimmed.slice(10).trim();
    }
  }

  return metadata;
}

/**
 * Generate a markdown table from sample data.
 */
function generateTable(samples) {
  const lines = [
    "| Sample | Description | Tags | Languages |",
    "|--------|-------------|------|-----------|",
  ];

  for (const sample of samples) {
    const name = sample.name;
    const title = sample.title || name;
    let description = sample.description || "";
    let tags = sample.tags || "";
    let languages = sample.languages || "";

    // Create link with title as display text
    const link = `[${title}](./samples/${name})`;

    // Escape any pipe characters in the content
    description = description.replace(/\|/g, "\\|");
    tags = tags.replace(/\|/g, "\\|");
    languages = languages.replace(/\|/g, "\\|");

    lines.push(`| ${link} | ${description} | ${tags} | ${languages} |`);
  }

  return lines.join("\n");
}

function main() {
  const scriptDir = __dirname;
  const repoRoot = path.dirname(scriptDir);
  const samplesDir = path.join(repoRoot, "samples");
  const readmePath = path.join(repoRoot, "README.md");

  console.log(`Scanning samples in: ${samplesDir}`);

  // Check samples directory exists
  if (!fs.existsSync(samplesDir)) {
    console.error(`Error: Samples directory not found: ${samplesDir}`);
    process.exit(1);
  }

  // Get all sample directories
  const sampleDirs = fs
    .readdirSync(samplesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("."))
    .map((dirent) => dirent.name)
    .sort();

  console.log(`Found ${sampleDirs.length} samples`);

  // Extract metadata from each sample
  const samples = [];
  for (const sampleName of sampleDirs) {
    const sampleReadme = path.join(samplesDir, sampleName, "README.md");

    const sampleData = { name: sampleName };

    if (fs.existsSync(sampleReadme)) {
      const metadata = extractMetadata(sampleReadme);
      sampleData.title = metadata.title;
      sampleData.description = metadata.description;
      sampleData.tags = metadata.tags;
      sampleData.languages = metadata.languages;
    } else {
      console.log(`  Warning: No README.md found in ${sampleName}`);
    }

    samples.push(sampleData);
  }

  // Generate the table
  const table = generateTable(samples);

  // Create the full section content
  const sectionContent = `${START_MARKER}
## Available Samples

${table}

*This list is auto-generated. Run \`node scripts/generate-samples-list.js\` to update.*
${END_MARKER}`;

  // Read the current README
  if (!fs.existsSync(readmePath)) {
    console.error(`Error: README not found: ${readmePath}`);
    process.exit(1);
  }

  let readmeContent = fs.readFileSync(readmePath, "utf-8");

  // Check if markers exist
  if (readmeContent.includes(START_MARKER) && readmeContent.includes(END_MARKER)) {
    // Replace existing section
    const pattern = new RegExp(
      escapeRegExp(START_MARKER) + "[\\s\\S]*?" + escapeRegExp(END_MARKER),
      "g"
    );
    readmeContent = readmeContent.replace(pattern, sectionContent);
    console.log("Replacing existing samples list...");
  } else {
    // Append to the end
    readmeContent = readmeContent.trimEnd() + "\n\n" + sectionContent + "\n";
    console.log("Appending new samples list...");
  }

  // Write the updated README
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Updated ${readmePath}`);
  console.log(`Total samples listed: ${samples.length}`);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main();

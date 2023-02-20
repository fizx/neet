const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const directory = process.argv[2];
const outputFile = process.argv[3];

if (!directory || !outputFile) {
  console.error("Usage: node build.js <directory> <outputFile>");
  process.exit(1);
}

function bundleDir(root) {
  const result = {};
  const files = fs.readdirSync(root);
  for (const file of files) {
    const filePath = path.join(root, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      const content = fs.readFileSync(filePath);
      const contentType = mime.contentType(path.extname(filePath));
      result[file] = {
        contentType,
        content: content.toString("base64"),
      };
    } else if (stats.isDirectory()) {
      result[file] = bundleDir(filePath);
    }
  }
  return result;
}

const bundledDir = bundleDir(directory);

const serverTemplate = `
// const mime = require("mime-types");

class StaticFileServer {
  constructor(bundledDir) {
    this.bundledDir = bundledDir;
  }

  async serve(req) {
    let filePath = req.url.split("?")[0];
    if (filePath.startsWith("/")) {
      filePath = filePath.substring(1);
    }
    let currentNode = this.bundledDir;
    let contentType = "application/octet-stream";
    let content;

    const segments = filePath.split("/").filter((s) => s !== "");
    for (const segment of segments) {
      currentNode = currentNode[segment];
      if (!currentNode) {
        throw new Error("Not found");
      }
    }

    if (currentNode.content) {
      content = Buffer.from(currentNode.content, "base64");
      contentType = currentNode.contentType;// || mime.contentType(path.extname(filePath));
    } else if currentNode["index.html"]) {
      currentNode = currentNode["index.html"];
      content = Buffer.from(currentNode.content, "base64");
      contentType = currentNode.contentType;// || mime.contentType(path.extname(filePath));
    }

    return {
      status: 200,
      headers: { "Content-Type": contentType },
      body: content,
    };
  }
}

module.exports = new StaticFileServer(${JSON.stringify(bundledDir)});
`;

fs.writeFileSync(outputFile, serverTemplate);
console.log(`Bundled directory '${directory}' to '${outputFile}'`);

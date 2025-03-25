const http = require("http");
const fs = require("fs");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));
const PORT = args.port || 3000; // Default port to 3000 if not specified

let homeContent = "";
let projectContent = "";
let registrationContent = "";

// Read files before starting server
fs.readFile("home.html", (err, data) => {
  if (err) {
    console.error("Error reading home.html:", err);
    return;
  }
  homeContent = data;
});

fs.readFile("project.html", (err, data) => {
  if (err) {
    console.error("Error reading project.html:", err);
    return;
  }
  projectContent = data;
});

fs.readFile("registration.html", (err, data) => {
  if (err) {
    console.error("Error reading registration.html:", err);
    return;
  }
  registrationContent = data;
});

// Create the server
const server = http.createServer((request, response) => {
  let url = request.url;
  response.writeHead(200, { "Content-Type": "text/html" });

  if (url === "/project") {
    response.write(projectContent);
  } else if (url === "/registration") {
    response.write(registrationContent);
  } else {
    response.write(homeContent);
  }
  response.end();
});

// Start the server on the specified port
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

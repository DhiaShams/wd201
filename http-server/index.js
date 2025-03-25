const http = require("http");
const fs = require("fs");
const minimist = require("minimist");
const args = minimist(process.argv.slice(2));
let homeContent = "";
let projectContent = "";

// Read home.html
fs.readFile("home.html", (err, home) => {
  if (err) {
    throw err;
  }
  homeContent = home;
});

// Read project.html
fs.readFile("project.html", (err, project) => {
    if (err) {
      throw err;
    }
    projectContent = project;
  });
  
  // Read registration.html
  fs.readFile("registration.html", (err, registration) => {
    if (err) {
      throw err;
    }
    registrationContent = registration;
  });

    // Start server only after reading both files
    http.createServer((request, response) => {
      let url = request.url;
      response.writeHead(200, { "Content-Type": "text/html" });

      switch (url) {
        case "/project":
          response.write(projectContent);
          break;
        case "/registration":
          response.write(registrationContent);
          break;
        default:
          response.write(homeContent);
          break;
      }
      response.end();
    }).listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
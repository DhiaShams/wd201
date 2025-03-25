const fs = require("fs");

// Step 1: Write to file
fs.writeFile("sample.txt", "Hello World. Welcome to Node.js File System module.", (err) => {
  if (err) throw err;
  console.log("File created!");

  // Step 2: Read file
  fs.readFile("sample.txt", (err, data) => {
    if (err) throw err;
    console.log("File content:", data.toString());

    // Step 3: Append content
    fs.appendFile("sample.txt", " This is my updated content", (err) => {
      if (err) throw err;
      console.log("File updated!");

      // Step 4: Rename file
      fs.rename("sample.txt", "test.txt", (err) => {
        if (err) throw err;
        console.log("File name updated!");

        // Step 5: Delete file
        fs.unlink("test.txt", (err) => {
          if (err) throw err;
          console.log("File deleted successfully!");
        });
      });
    });
  });
});

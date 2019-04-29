import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

fs.realpath(process.argv[1], function(_, arg) {
    const main = path.resolve(__dirname, "main.js");
    const child = spawn("node", [main].concat(process.argv.slice(2)));
    child.stdout.on("data", function(data) {
        console.log(data.toString());
    });
    child.stderr.on("data", function(data) {
        console.error(data.toString());
    });
    child.on("exit", function(code) {
        process.exit(code || 0);
    });
});

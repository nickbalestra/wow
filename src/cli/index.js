import { config as dotenv } from "dotenv";
import { resolve } from "path";
import yargs from "yargs";
import deployHandler from "./cmds/deploy";

dotenv({
  path: resolve(process.cwd(), ".wowrc")
});

export async function run() {
  yargs
    .scriptName("wow")
    .command(
      "$0 [path]",
      "Performs a deployment on the edge",
      yargs =>
        yargs
          .option("path", {
            describe: "the local path to deploy",
            default: "."
          })
          .coerce("path", path =>
            path === "." || !path ? process.cwd() : resolve(process.cwd(), path)
          ),
      deployHandler
    )
    .fail(function(msg, err) {
      console.error("\nError details:");
      console.error(err);
      process.exit(1);
    }).argv;
}

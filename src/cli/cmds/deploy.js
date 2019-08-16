import axios from "axios";
import chalk from "chalk";
import clipboard from "clipboardy";
import FormData from "form-data";
import { createReadStream } from "fs";
import Listr from "listr";
import { basename, resolve } from "path";
import readdir from "recursive-readdir";
import { CF_API_URL } from "../../constants.js";
import {
  generateHash,
  isNotDirectoryOrDotFile,
  Perf,
  responseHandler
} from "../../utils";

const perf = new Perf();

export default async ({ path }) => {
  perf.start();

  const { CF_ID, CF_EMAIL, CF_KEY } = process.env;
  axios.defaults.baseURL = `${CF_API_URL}/accounts/${CF_ID}`;
  axios.defaults.headers.common["X-Auth-Email"] = CF_EMAIL;
  axios.defaults.headers.common["X-Auth-Key"] = CF_KEY;
  axios.defaults.validateStatus = () => true;

  const deployNameSpace = generateHash();
  let zonelessSubdomain;

  const tasks = new Listr([
    {
      title: "Setup",
      task: ctx =>
        new Listr(
          [
            {
              title: "Retrieving zoneless subdomain",
              task: () =>
                axios({
                  url: `/workers/subdomain`
                }).then(
                  responseHandler(
                    ({ subdomain }) => (zonelessSubdomain = subdomain)
                  )
                )
            },
            {
              title: "Creating KV Namespace",
              task: ctx => {
                return axios({
                  method: "post",
                  url: `/storage/kv/namespaces`,
                  data: { title: deployNameSpace }
                }).then(responseHandler(result => (ctx.namespace = result)));
              }
            }
          ],
          { concurrent: true }
        )
    },
    {
      title: "Edge deployment",
      task: () =>
        new Listr([
          {
            title: `Preparing files in ${path}`,
            task: async ctx =>
              readdir(path, [isNotDirectoryOrDotFile]).then(
                files => (ctx.files = files)
              )
          },
          {
            title: "Writing",
            task: () =>
              new Listr(
                [
                  {
                    title: `KV`,
                    task: async ctx => {
                      const toWrite = ctx.files.map(file => {
                        return {
                          title: file,
                          task: () =>
                            axios({
                              method: "put",
                              url: `/storage/kv/namespaces/${
                                ctx.namespace.id
                              }/values/${basename(file)}`,
                              data: createReadStream(file)
                            }).then(responseHandler())
                        };
                      });
                      return new Listr(toWrite, { concurrent: true });
                    }
                  },
                  {
                    title: `Worker script`,
                    task: ctx => {
                      const formData = new FormData();
                      formData.append(
                        "script",
                        createReadStream(
                          resolve(__dirname, "../../worker/script.js")
                        )
                      );
                      formData.append(
                        "metadata",
                        JSON.stringify({
                          body_part: "script",
                          bindings: [
                            {
                              type: "kv_namespace",
                              name: "bucket",
                              namespace_id: ctx.namespace.id
                            }
                          ]
                        })
                      );
                      return axios({
                        method: "put",
                        url: `/workers/scripts/${deployNameSpace}`,
                        headers: {
                          "Content-Type": `multipart/form-data; boundary=${
                            formData._boundary
                          }`
                        },
                        data: formData
                      }).then(responseHandler());
                    }
                  }
                ],
                { concurrent: true }
              )
          }
        ])
    },
    {
      title: `Promote deployment`,
      task: () =>
        axios({
          method: "post",
          url: `workers/scripts/${deployNameSpace}/subdomain`,
          headers: {
            "Content-Type": "application/json"
          },
          data: { enabled: true }
        }).then(responseHandler())
    }
  ]);
  await tasks.run();
  perf.end();

  const deployUrl = `https://${deployNameSpace}.${zonelessSubdomain}.workers.dev`;
  await clipboard.write(deployUrl);

  const deployStats = `[in clipboard] [${perf.duration()}]`;
  console.log(`  ❯ ${chalk.cyan.bold(deployUrl)} ${chalk.grey(deployStats)}`);
};

WOW CLI
-------

This project was highly inspired by [NOW](https://github.com/zeit/now-cli).

**Note**: This repo still under development and is currently a simple POC. **TLDR: Don't use in Production.**

## Demo

[![](https://s3.gifyu.com/images/wow.gif)](https://s3.gifyu.com/images/wow.gif)


## Architecture

The idea is to be able to deploy an app (for the moment just a simple UI) to the edge.

- **Storage**: All the app assets will be stored inside a newly generated KV namespace
    - key: `path/to/file-name.extenstion`
    - value: `file src`
- **Worker**: Behind the scene a new worker will be created and deployed, binded with the KV namespace in order to be able to serve the requested assets.
- **Zoneless**: The worker will be binded to a new subdomain attached to the workers.dev zoneless.
    - Subdomain Naming Strategy: currently sub-domain/kv/worker-name are being namespaced with a hash, but git/branch/name and other strategied could be implemented.

The result is a generated URL for the app, ie: [870b9d1f12ea91.nb.workers.dev](https://1870b9d1f12ea91.nb.workers.dev)

## Usage

To install the latest version of Wow CLI:

```
git clone && cd inside the repo
yarn install && yarn build &&yarn link
cd && yarn link wow

# once published will be only requirede to => yarn add -g wow
```

To quickly deploy a project, run the following commands:

```
cd <PROJECT>          # Change directory to the project
now <PATH/TO/DIST >   # Deploy to the edge
```

**Note**: the CLI require the following global env variables:

```
CF_ID=your-cloudflare-id
CF_EMAIL=your-cloudflare-account-email
CF_KEY=your-cloudflare-api-key
```

You can create a .wowrc file in the root of your project to expose them (see `.wowrc.example)


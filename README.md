# vue-serverless-template

This directory contains all of the code and infrastructure-as-code for running
and deploying a basic Vue app with a serverless back end

### Setup & Installation

In order to get everything to work properly, you will need to have the following
software installed on your computer:

-   Node.JS
-   npm (comes with Node)

To install all dependencies for the project, run `npm install` in each of the
following directories:

-   `.`
-   `./server`
-   `./client`

In order to get the application to work, you will also need to set up your AWS
credentials for the project. You will need to have lines in your `~/.aws/credentials`
file that define the credentials for a `serverless-admin` user.

### Deployment

The application runs on AWS and is managed/deployed using the
[serverless framework](https://serverless.com/). It is split up into 2 "stacks,"
each of which are deployed separately. The stacks are defined in these
configuration files:

-   `serverless_backend.yml`
    -   This file contains the configuration for the back end stack, which
        includes Lambda functions that implement the app's API and business logic
        as well as the CloudFront distribution information
    -   Deploy or update this stack by running `npm run deploy-backend -- -s [stage]` from this directory
-   `serverless_frontend.yml`
    -   This file contains the configuration for the front end stack, which is
        a Vue application
    -   Deploy or update this stack by running `npm run deploy-frontend -- -s [stage]` from this directory
    -   To run the front end locally, run `npm run serve -- -s [stage]` from this directory. This will
        serve the application on localhost, and will point to all APIs and storage and resources from the
        deployed stacks in the specified stage

Note that these three stacks depend on one another, so they must be initially deployed
in the order above. For instance, the front end stack needs to look up the
API URL for the back end stack and thus cannot be deployed unless the back end has
already been deployed.

RUN ALL OF THESE COMMANDS VIA BASH (or a bash emulator for Windows, like Git Bash).
The commands rely on bash scripts which will not run via the Windows command
line or PowerShell.

### Hosting

The only piece of infrastructure for this app that is not managed via serverless in
infrastructure-as-code is the SSL certificate, which is managed via AWS ACM, respectively.

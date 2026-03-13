# Defang Provider Handoff Sample

If you are using Defang to deploy your application into your customer's cloud accounts, you may want to provide a white-labeled static site that your customers can use to configure their cloud account for your deployment. This sample demonstrates how to do that.

The `compose.yaml` file in this directory defines a single service, `app`, which serves a static site on port 80. The static site is built from the `./app` directory, which contains an `index.html` file that provides instructions for the customer on how to configure their cloud account for your deployment.

---

Title: Defang Provider Handoff Sample

Short Description: A sample application that demonstrates how to provide a white-labeled static site for customers to configure their cloud accounts for your deployment.

Tags: Defang, Cloud, Deployment, Static Site
Languages: HTML, CSS, JavaScript

# React-Vite-Railpack

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-react-template%26template_owner%3DDefangSamples)

This sample shows how to get a simple React app up and running with Defang.
It includes Vite and ESLint, which are common build tools for React development. The container image is automatically built by [Railpack](https://railpack.com/).

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account

## Development

To run the application locally, you can use the following command (make sure you've got `npm` and [Node.js](https://nodejs.org/en) installed):

```bash
npm install
npm run dev
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:

```bash
defang compose up
```

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
   ```bash
   defang --provider=aws compose up
   ```

## Monitoring and Management

### Check Service Status

To check the status of your deployed services:

```bash
defang services
```

This command will show you:
- Service names and their current status
- Deployment IDs
- Service URLs
- Resource allocations

### View Real-time Logs

To view logs from your deployed application:

```bash
# View logs for all services
defang tail

# View logs for a specific service
defang tail --name app
```

### Monitor via Defang Portal

You can also monitor your application through the web interface:
- Visit [https://portal.defang.dev/](https://portal.defang.dev/)
- View service status, logs, and deployment history
- Monitor resource usage and performance metrics

Note: The Defang Portal displays services deployed to Defang Playground.

### Update Your Application

To deploy updates to your application:

```bash
defang compose up
```

Defang will:
- Build and deploy the new version with zero downtime
- Keep the current version running while deploying the new one
- Switch traffic to the new version after health checks pass
- Stop the old version automatically

### Cleanup and Teardown

To destroy your deployed services and clean up resources:

```bash
defang compose down
```

This will:
- Stop all running services
- Remove the deployed containers
- Clean up associated resources

## Troubleshooting

### Common Issues

**Service stuck in PROVISIONING state:**
- This is normal for initial deployments, which can take a few minutes
- Check logs with `defang tail --name app` for any error messages
- Verify your container starts successfully and listens on the correct port (5173)

**Cannot access the deployed application:**
- Ensure the service status shows as "HEALTHY" using `defang services`
- Check that the application is configured to listen on `0.0.0.0:5173` (not `localhost`)
- Verify the port configuration in `compose.yaml` matches your application

**Deployment fails:**
- Check for syntax errors in `compose.yaml`
- Ensure the Docker build context is correct
- Review deployment logs with `defang tail`

**"missing memory reservation" warning:**
- This sample already includes memory reservations (512MB)
- Adjust the memory reservation in `compose.yaml` if needed for your use case

---

Title: React

Short Description: A minimal React app running on Defang.

Tags: React, Vite, JavaScript, Frontend, Railpack

Languages: JavaScript

/**
 * Represents a sample Pulumi script that creates a DefangService.
 * This script matches the configuration in the compose.yaml file.
 */
import { DefangService } from "@defang-io/pulumi-defang/lib";

const nodejs = new DefangService("nodejs", {
  build: {
    context: "./app",
  },
  ports: [{ mode: "ingress", target: 3000  }],
});

export const fqdn = nodejs.fqdn;

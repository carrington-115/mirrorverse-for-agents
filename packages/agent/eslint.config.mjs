import { nodeConfig } from "@mirrorverse/eslint-config/node";

export default [...nodeConfig, { ignores: ["dist/**", "node_modules/**", ".turbo/**"] }];

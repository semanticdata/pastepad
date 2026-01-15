import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	// Test against minimum supported version (1.84.0) to ensure backward compatibility
	// This ensures the extension works for users with older VS Code versions
	version: '1.84.0'
});

// Note: To test against the latest VS Code version, run:
// VSCODE_VERSION=stable pnpm test
// Or create a separate configuration in .vscode/launch.json


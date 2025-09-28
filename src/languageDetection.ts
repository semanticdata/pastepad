export function getLanguageFromTitle(title: string): string {
	// Extract the file extension from the title
	const extensionMatch = title.match(/\.([a-zA-Z0-9]+)$/);

	if (!extensionMatch) {
		return 'plaintext';
	}

	const extension = extensionMatch[1].toLowerCase();

	// Map common file extensions to VS Code language IDs
	const extensionToLanguage: { [key: string]: string } = {
		// Programming languages
		'js': 'javascript',
		'jsx': 'javascriptreact',
		'ts': 'typescript',
		'tsx': 'typescriptreact',
		'py': 'python',
		'java': 'java',
		'c': 'c',
		'cpp': 'cpp',
		'cc': 'cpp',
		'cxx': 'cpp',
		'h': 'c',
		'hpp': 'cpp',
		'cs': 'csharp',
		'php': 'php',
		'rb': 'ruby',
		'go': 'go',
		'rs': 'rust',
		'swift': 'swift',
		'kt': 'kotlin',
		'scala': 'scala',
		'r': 'r',
		'pl': 'perl',
		'sh': 'shellscript',
		'bash': 'shellscript',
		'zsh': 'shellscript',
		'fish': 'shellscript',
		'ps1': 'powershell',
		'psm1': 'powershell',

		// Web technologies
		'html': 'html',
		'htm': 'html',
		'css': 'css',
		'scss': 'scss',
		'sass': 'sass',
		'less': 'less',
		'vue': 'vue',
		'svelte': 'svelte',

		// Data formats
		'json': 'json',
		'xml': 'xml',
		'yaml': 'yaml',
		'yml': 'yaml',
		'toml': 'toml',
		'ini': 'ini',
		'cfg': 'ini',
		'conf': 'ini',

		// Markup and documentation
		'md': 'markdown',
		'markdown': 'markdown',
		'rst': 'restructuredtext',
		'tex': 'latex',
		'latex': 'latex',

		// Databases
		'sql': 'sql',

		// Other formats
		'dockerfile': 'dockerfile',
		'makefile': 'makefile',
		'cmake': 'cmake',
		'gradle': 'groovy',
		'properties': 'properties',
		'env': 'properties',
		'log': 'log',
		'txt': 'plaintext',

		// Config files
		'gitignore': 'ignore',
		'dockerignore': 'ignore',
		'eslintrc': 'json',
		'prettierrc': 'json',
		'babelrc': 'json',
		'tsconfig': 'json',
		'package': 'json'
	};

	return extensionToLanguage[extension] || 'plaintext';
}

export function getFileNameFromTitle(title: string): string {
	// If the title already looks like a filename, use it as-is
	if (title.includes('.')) {
		return title;
	}

	// For titles without extensions, add a generic extension based on content detection
	// This is a fallback - ideally the paste title should include the extension
	return `${title}.txt`;
}
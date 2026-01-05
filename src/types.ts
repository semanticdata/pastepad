export interface PasteItem {
	title: string;
	content: string;
	modified_on: string;
	listed?: boolean; // true for listed, false for unlisted
}

export interface ProfileData {
	content: string;
	theme?: string;
	css?: string;
	head?: string;
	verified?: boolean;
	pfp?: string;
	metadata?: string;
	branding?: string;
	type?: 'profile' | 'other';
}

export interface NowPageData {
	content: string;
	updated: string;
	listed: string;
}

export interface ProfilePictureUploadResponse {
	message: string;
	bytesReceived?: number;
	filename?: string;
}

// Weblog types
export interface WeblogEntry {
	address: string;
	location: string;
	title: string;
	date: string; // Unix timestamp as string
	type: string;
	status: string;
	source: string;
	body: string;
	output: string;
	metadata: string; // JSON string
	entry: string; // Entry ID
	id?: string;
}

export interface WeblogConfiguration {
	object?: {
		'weblog-title'?: string;
		'weblog-description'?: string;
		author?: string;
		separator?: string;
		'tag-path'?: string;
		timezone?: string;
		'date-format'?: string;
		'default-post'?: string;
		'feed-post-count'?: string;
		'post-path-format'?: string;
		'recent-posts-count'?: string;
		'recent-posts-format'?: string;
		'post-list-format'?: string;
		'search-status'?: string;
		'search-results-success-message'?: string;
		'search-results-failure-message'?: string;
		'search-results-format'?: string;
	};
	json?: string;
	raw?: string;
}

export interface WeblogTemplate {
	template: string;
}

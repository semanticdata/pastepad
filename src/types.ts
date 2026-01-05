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

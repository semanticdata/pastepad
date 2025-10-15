export interface PasteItem {
	title: string;
	content: string;
	modified_on: string;
	listed?: boolean; // true for listed, false for unlisted
}

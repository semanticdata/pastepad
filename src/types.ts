export interface PasteItem {
	title: string;
	content: string;
	modified_on: string;
	listed?: number | string; // 1 for listed, 0 for unlisted
}

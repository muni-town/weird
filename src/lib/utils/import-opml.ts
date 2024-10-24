export function importLinksFromOPMLFile(): Promise<{ label?: string; url: string }[]> {
	return new Promise((resolve) => {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.style.display = 'none';
		fileInput.accept = '.opml,.xml';

		fileInput.onchange = (e: Event) => {
			const target = e.target as HTMLInputElement;
			const file = target.files?.[0];

			if (file) {
				const reader = new FileReader();

				reader.onload = (e: ProgressEvent<FileReader>) => {
					const contents = e.target?.result as string;
					const parser = new DOMParser();
					const doc = parser.parseFromString(contents, 'text/xml');
					const outlines = doc.querySelectorAll('outline');
					const newLinks = Array.from(outlines)
						.filter((outline) => outline.hasAttribute('xmlUrl'))
						.map((link) => ({
							label: link.getAttribute('text') || '',
							url: link.getAttribute('xmlUrl') || ''
						}));

					resolve(newLinks);
				};
				reader.readAsText(file);
			}

			fileInput.remove();
		};

		fileInput.click();
	});
}

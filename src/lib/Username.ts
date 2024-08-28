import { Component } from 'leaf-proto';

export class Username extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'Username';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [new Utf8('The primary, human readable name associated to an Entity.')];
	}
}

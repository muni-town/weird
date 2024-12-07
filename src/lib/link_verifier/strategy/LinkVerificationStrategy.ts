export interface ILinkVerificationStrategy {
	name: string;
	verify(userProfileLink: string[]): Promise<boolean>;
}

export type LinkVerificationStrategyFactory = (dom: Window) => ILinkVerificationStrategy;

export abstract class LinkVerificationStrategy implements ILinkVerificationStrategy {
	protected dom: Window;
	protected strategyName: string;

	constructor(name: string, dom: Window) {
		this.dom = dom;
		this.strategyName = name;
	}

	get name(): string {
		return this.strategyName;
	}

	public async verify(userProfileLink: string[]): Promise<boolean> {
		throw new Error('Not Implemented');
	}
}

import { JSDOM } from 'jsdom';

export interface ILinkVerificationStrategy {
	name: string;
	verify(userProfileLink: string): Promise<boolean>;
}

export type LinkVerificationStrategyFactory = (dom: JSDOM) => ILinkVerificationStrategy;

export abstract class LinkVerificationStrategy implements ILinkVerificationStrategy {
	protected dom: JSDOM;
	protected strategyName: string;

	constructor(name: string, dom: JSDOM) {
		this.dom = dom;
		this.strategyName = name;
	}

	get name(): string {
		return this.strategyName;
	}

	public async verify(target: string): Promise<boolean> {
		throw new Error('Not Implemented');
	}
}

import { base32Encode, Component, type DatabaseDump, type EntityPath } from 'leaf-proto';
import _ from 'underscore';

export function prettyPrintDump(
	dump: DatabaseDump,
	knownComponents: (new (...any: any) => Component)[]
): string {
	let result = '';
	const s = (n: number) => ' '.repeat(n * 2);
	const p = (n: number, ...args: any) => {
		result += `${' '.repeat(n * 2)} ${args.join(' ')}\n`;
	};
	const e = (a: any) => base32Encode(new Uint8Array(a));

	p(0, 'Database dump:');
	p(1, 'Subspace secrets:');
	for (const [subspace, secret] of dump.subspace_secrets) {
		p(2, `${e(subspace)}: ${e(secret)}`);
	}

	p(1, 'Namespaces:');
	for (const [namespace, doc] of dump.documents) {
		p(2, `${e(namespace)}:`);
		p(3, `secret: ${e(doc.secret)}`);
		p(3, `Subspaces:`);
		for (const [subspace, entities] of doc.subspaces) {
			p(4, `${e(subspace)}:`);
			for (const [path, ent] of entities) {
				p(5, `${formatEntityPath(path)}: ${e(ent.digest)}`);

				for (let [schema, datas] of ent.components) {
					schema = new Uint8Array(schema);

					let known = false;
					for (let knownComponent of knownComponents as any[]) {
						if (_.isEqual(knownComponent.schemaId(), schema)) {
							known = true;

							for (const data of datas) {
								try {
									const comp = knownComponent.deserialize(new Uint8Array(data));
									if (data.length < 1024) {
										p(6, `${knownComponent.componentName()}: ${JSON.stringify(comp)}`);
									} else {
										p(6, `${knownComponent.componentName()}: [truncated]`);
									}
								} catch (e) {
									p(6, `Could not parse ${knownComponent.componentName()}: ${e}`);
								}
							}

							break;
						}
					}

					if (!known) {
						p(6, 'unknown');
					}
				}
			}
		}
	}

	return result;
}

function formatEntityPath(p: EntityPath): string {
	let s = '';
	for (const segment of p) {
		if ('String' in segment) {
			s += `/${segment.String}`;
		} else if ('Bytes' in segment) {
			s += `/${base32Encode(new Uint8Array(segment.Bytes))}`;
		} else {
			s += `/${JSON.stringify(segment)}`;
		}
	}
	return s;
}

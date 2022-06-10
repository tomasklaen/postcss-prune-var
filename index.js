/**
 * @typedef {object} UseRecord
 * @property {number} uses
 * @property {Set<any>} declarations
 * @property {Set<string>} dependencies
 */

module.exports = () => {
	return {
		postcssPlugin: 'postcss-prune-var',
		Once(root) {
			/** @type Map<string, UseRecord> */
			const records = new Map();

			/** @type {(variable: string) => UseRecord} */
			const getRecord = (variable) => {
				let record = records.get(variable);
				if (!record) {
					record = {uses: 0, dependencies: new Set(), declarations: new Set()};
					records.set(variable, record);
				}
				return record;
			};

			/** @type {(variable: string) => void} */
			const registerUse = (variable) => {
				const record = getRecord(variable);
				record.uses++;
				for (const dependency of record.dependencies) registerUse(dependency);
			};

			/** @type {(variable: string, dependency: string) => void} */
			const registerDependency = (variable, dependency) => {
				const record = getRecord(variable);
				record.dependencies.add(dependency);
			};

			// Detect variable uses
			root.walkDecls((decl) => {
				const isVar = decl.prop.startsWith('--');

				// Initiate record
				if (isVar) getRecord(decl.prop).declarations.add(decl);

				if (!decl.value.includes('var(')) return;

				for (const match of decl.value.matchAll(/var\(\s*(?<name>--[^ ,\);]+)/g)) {
					const variable = match.groups.name.trim();
					if (isVar) {
						registerDependency(decl.prop, variable);
					} else {
						registerUse(variable);
					}
				}
			});

			// Remove unused variables
			for (const {uses, declarations} of records.values()) {
				if (uses === 0) {
					for (let decl of declarations) decl.remove();
				}
			}
		},
	};
};

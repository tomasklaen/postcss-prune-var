const assert = require('assert');
const postcss = require('postcss').default;
const pruneVar = require('./');

const tests = [];
const test = (name, fn) => (fn.displayName = name) && tests.push(fn);

test('base', async () => {
	const input = `
:root {
	--root-unused: red;
	--root-unused-proxy: var(--root-unused);
	--root-used: blue;
	--unused-duplicate: yellow;
	--circular: var(--circular);
	color: var(--circular);
}
.foo {
	--unused: red;
	--unused-proxy: var(--unused);
	--proxied: pink;
	--proxy: var(--proxied);
	--used: green;
	--unused-duplicate: yellow;
	color: var(--root-used);
	background: linear-gradient(to bottom, var(--used), var(--proxy));
}
`;
	const output = `
:root {
	--root-used: blue;
	--circular: var(--circular);
	color: var(--circular);
}
.foo {
	--proxied: pink;
	--proxy: var(--proxied);
	--used: green;
	color: var(--root-used);
	background: linear-gradient(to bottom, var(--used), var(--proxy));
}
`;
	const result = await postcss([pruneVar()]).process(input, {from: 'test.css', to: 'out.css'});
	assert.equal(result.css, output, `Result different than expected`);
});

test('duplicate var definitions', async () => {
	const input = `
:root {
	--color-state-bg-striped: green;
}

.example {
	--color-component-bg: red;
	--color-state-bg: var(--color-component-bg);

	.cell {
		background-color: var(--color-state-bg);
	}

	.child > .row:nth-of-type(odd) > * {
		--color-state-bg: var(--color-state-bg-striped);
	}
}
`;
	const result = await postcss([pruneVar()]).process(input, {from: 'test.css', to: 'out.css'});
	assert.equal(result.css, input, `Result different than expected`);
});

test('file filtering', async () => {
	const output = `
:root {
	--root-unused: red;
	--root-unused-proxy: var(--root-unused);
	--root-used: blue;
	--unused-duplicate: yellow;
	--circular: var(--circular);
	color: var(--circular);
}
.foo {
	--unused: red;
	--unused-proxy: var(--unused);
	--proxied: pink;
	--proxy: var(--proxied);
	--used: green;
	--unused-duplicate: yellow;
	color: var(--root-used);
	background: linear-gradient(to bottom, var(--used), var(--proxy));
}
`;

	const result = await postcss([pruneVar({skip: ['fixtures/**']})]).process(output, {
		from: 'fixtures/test.css',
		to: 'out.css',
	});
	assert.strictEqual(result.css, output, `Result different than expected`);
});

(async function () {
	for (const test of tests) {
		try {
			await test();
			console.log(`✔ ${test.displayName}`);
		} catch (error) {
			console.log(`❌ ${test.displayName}`);
			console.error(error);
		}
	}
})();

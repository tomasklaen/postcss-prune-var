const assert = require('assert');
const postcss = require('postcss').default;
const pruneVar = require('./');

async function test() {
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
}

test();

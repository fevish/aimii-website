const yaml = require('js-yaml');
const { DateTime } = require('luxon');
const dateFormatter = (format) => (date) => DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(format);
const fs = require('fs');
const NOT_FOUND_PATH = '_site/404.html';

module.exports = function (eleventyConfig) {
	eleventyConfig.setBrowserSyncConfig({
		callbacks: {
			ready: function (err, bs) {
				bs.addMiddleware('*', (req, res) => {
					if (!fs.existsSync(NOT_FOUND_PATH)) {
						throw new Error(`Expected a \`${NOT_FOUND_PATH}\` file but could not find one. Did you create a 404.html template?`);
					}

					const content_404 = fs.readFileSync(NOT_FOUND_PATH);
					// Add 404 http status code in request header.
					res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
					// Provides the 404 content without redirect.
					res.write(content_404);
					res.end();
				});
			},
		},
	});

	// Redirects
	eleventyConfig.addPassthroughCopy('_redirects');

	// Date filter for liquid
	Object.entries({
		postDate: 'yyyy-MM-dd',
		readableDate: 'LLL dd yyyy',
	}).forEach(([key, format]) => {
		eleventyConfig.addLiquidFilter(key, dateFormatter(format));
	});

	// Custom filter to make a string URL-ready
	eleventyConfig.addFilter('url_ready', function (value) {
		// Ensure the value is a string
		if (typeof value !== 'string') {
			return value;
		}

		// Transform the string
		return value
			.toLowerCase()
			.replace(/ /g, '-')
			.replace(/[^a-zA-Z0-9-]/g, '')
			.replace(/^-+/, '') // Remove leading hyphens
			.replace(/-+$/, '') // Remove trailing hyphens
			.replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
	});

	// Copy `assets/` to `_site/assets`
	eleventyConfig.addPassthroughCopy('assets');
	eleventyConfig.addWatchTarget('_site/assets/*.css');

	// Copy riot.txt for verification
	eleventyConfig.addPassthroughCopy('riot.txt');

	eleventyConfig.setBrowserSyncConfig({
		files: ['_site/assets/css/*.css'],
	});

	// Markdown filter for liquid
	const md = require('markdown-it')({
		html: false,
		breaks: true,
		linkify: true,
	});

	eleventyConfig.addLiquidFilter('markdown', (markdownString) => md.render(markdownString));

	// Don't process folders with static assets
	eleventyConfig.addPassthroughCopy('admin');

	eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

	eleventyConfig.addPassthroughCopy('site/_redirects');
	return {
		dir: {
			// These values are both relative to your input directory.
			input: '.',
			includes: 'sections',
			layouts: 'layout',
			data: '_data',
		},
		pathPrefix: "",
		passthroughFileCopy: true,
	};
};

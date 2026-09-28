// Template: replace every __PLACEHOLDER__. Keep markdown.format 'detect' (synced .md is CommonMark)
// and indexBlog:false (no blog). See references/stages.md stage 9.
import {themes as prismThemes} from 'prism-react-renderer';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

const REPO = 'https://github.com/__OWNER__/__REPO__';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '__SITE_NAME__',
  tagline: '__TAGLINE__',
  favicon: 'img/favicon.svg',
  url: process.env.SITE_URL ?? 'https://__OWNER_LC__.github.io',
  baseUrl: process.env.BASE_URL ?? '/__REPO__/',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  organizationName: '__OWNER__',
  projectName: '__REPO__',
  markdown: {
    mermaid: true,
    // The synced repository docs are plain Markdown (they contain `<`, `{port}`
    // and similar text that MDX would parse), so .md files use CommonMark.
    format: 'detect',
    hooks: {onBrokenMarkdownLinks: 'throw'},
  },
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
  ],
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Roboto:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap',
  ],
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {sidebarPath: './sidebars.js', routeBasePath: 'docs'},
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      },
    ],
  ],
  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {hashed: true, indexDocs: true, indexBlog: false, indexPages: false, docsRouteBasePath: 'docs', highlightSearchTermsOnTargetPage: true},
    ],
  ],
  themeConfig: {
    image: 'img/og.png',
    colorMode: {defaultMode: 'dark', respectPrefersColorScheme: true},
    navbar: {
      title: '__SITE_NAME__',
      logo: {alt: 'KnowMe', src: 'img/logo.svg', width: 32, height: 32},
      items: [
        {type: 'docSidebar', sidebarId: 'docs', label: 'Docs', position: 'left'},
        // __EXTRA_NAV_ITEMS__ e.g. {to: '/docs/playbook', label: 'Playbook', position: 'left'},
        //   standalone static pages: {href: 'pathname:///architecture/report.html', label: 'Report', position: 'left'},
        {href: REPO, label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'Overview', to: '/docs/'},
            // __EXTRA_FOOTER_DOC_LINKS__
          ],
        },
        {
          title: 'KnowMe',
          items: [
            {label: 'know-me.tools', href: 'https://know-me.tools'},
            {label: 'GitHub', href: REPO},
          ],
        },
      ],
      copyright: `__COPYRIGHT_OWNER__ © ${new Date().getFullYear()}`,
    },
    mermaid: {theme: {light: 'neutral', dark: 'dark'}},
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula, additionalLanguages: ['rust', 'toml']},
  },
};

export default config;

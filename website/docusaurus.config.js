const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'micro-ROS doc',
  tagline: 'puts ROS 2 onto microcontrollers',
  url: 'https://github.com/chaos4ros2',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'chaos4ros2', // Usually your GitHub org/user name.
  projectName: 'micro_ros_doc', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'micro-ROS',
      logo: {
        alt: 'micro-ROS Logo',
        src: 'img/logonav.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'Overview/features_and_architecture', // 指定した項目が最初にメイン画面に表示される
          position: 'right',
          label: 'Overview',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'right',
          label: 'Concepts',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'right',
          label: 'Tutorials',
        },
        {
          type: 'doc',
          docId: 'intro',
          position: 'right',
          label: 'API',
        },
        {to: '/blog', label: 'Blog', position: 'right'},
        {
          href: 'https://github.com/facebook/docusaurus',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/Overview/features_and_architecture',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'ROS Discourse',
              href: 'https://discourse.ros.org/',
            },
            {
              label: 'micro-ROS official',
              href: 'https://micro.ros.org/',
            },
            {
              label: 'Stack Overflow（ROS2）',
              href: 'https://stackoverflow.com/questions/tagged/ros2',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'micro-ROS GitHub',
              href: 'https://github.com/micro-ROS',
            },
            {
              label: 'ROS2 GitHub',
              to: 'https://github.com/ros2',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // sidebarPath: require.resolve('./sidebars.js'),
          sidebarPath: require.resolve('./sidebars.json'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};

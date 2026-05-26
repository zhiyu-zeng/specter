import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/",
  title: "Specter",
  description: "Unified Play Integrity and root hiding stack for Android",
  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
  ],
  vite: {
    publicDir: ".vitepress/public",
  },
  themeConfig: {
    logo: { src: "/ghost.svg", alt: "Specter" },

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Guide", link: "/guide/webui" },
      { text: "Reference", link: "/reference/config" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [{ text: "Installation", link: "/getting-started" }],
      },
      {
        text: "Guide",
        items: [
          { text: "WebUI Guide", link: "/guide/webui" },
          { text: "Keybox Management", link: "/guide/keybox" },
          { text: "Conflict Resolution", link: "/guide/conflicts" },
          { text: "Best Setup", link: "/guide/best-setup" },
          { text: "FAQ", link: "/guide/faq" },
          { text: "Compatibility", link: "/guide/compatibility" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
          { text: "Support", link: "/guide/support" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Configuration", link: "/reference/config" },
          { text: "Glossary", link: "/reference/glossary" },
          { text: "Architecture", link: "/architecture" },
          { text: "Development", link: "/development" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/dpejoh/specter" },
    ],
  },
});

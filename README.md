# sanity-plugin-prefixed-slug

Editor friendly slug fields for your Sanity.io studio. Prefixed URLs and auto-slugifying values.

![Screenshot of the plugin in action](src/demo.gif)

💡 This plugin used to be called `sanity-plugin-better-slug`. As that was pretentious, egoic and unclear, I've made the switch to `prefixed-slug`.

## Installation

Start by enabling it in your studio:

```bash
yarn add sanity-plugin-prefixed-slug
# or npm
npm i sanity-plugin-prefixed-slug
```

Then, use the custom input component in your `slug` field(s):

```js
import SlugInput from 'sanity-plugin-prefixed-slug'

export default {
  name: 'testing-slugs',
  type: 'document',
  fields: [
    {
      name: 'slug_regular_custom_input',
      type: 'slug',
      inputComponent: SlugInput,
      options: {
        source: 'title',
        urlPrefix: 'https://site.url',
        // Use isUnique/maxLength just like you would w/ the regular slug field
        isUnique: MyCustomIsUniqueFunction,
        maxLength: 30,
      },
    },
    {
      // If you want to customize how slugs are formatted
      name: 'slug_custom_format',
      type: 'slug',
      inputComponent: SlugInput,
      options: {
        urlPrefix: 'https://site.url',
        slugify: (slugString) => slugString.toLowerCase(),
        // You can also avoid slugifying entirely by returning the full value:
        slugify: (slugString) => slugString,
      },
    },
    {
      // If you want to provide a custom path based on the current document:
      name: 'slug_function_path',
      type: 'slug',
      inputComponent: SlugInput,
      options: {
        urlPrefix: (document) => `https://site.url/${document.lang}`,
        // It could even be a promise!
        urlPrefix: async (document) => {
          const subPath = await getDocumentSubPath(document) // ficticious method
          return `https://site.url/${subPath}`
        },
      },
    },
  ],
}
```

Upgrading from sanity-plugin-better-slug? Rename your `options.basePath` to `options.urlPrefix`.

## Roadmap

- [ ] Adapt to Sanity v3
- [ ] get merged into `@sanity/base`
  - That's right! The goal of this plugin is to become obsolete. It'd be much better if the official type included in Sanity had this behavior from the get-go. Better for users and the platform :)

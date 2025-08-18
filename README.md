# StarpathVision

![App screenshot](public/placeholder.svg)

StarpathVision is an experimental React and TypeScript application that blends persona-building with tarot-inspired exploration. The repository includes persona definitions and tarot assets to help prototype narrative or divination experiences.

## Getting Started

```bash
pnpm install
pnpm dev     # start development server
pnpm build   # build for production
pnpm lint    # run ESLint
```

## Directory Structure

```
StarpathVision/
├─ src/             # React source code (components, pages, hooks)
├─ public/          # Static assets (favicon, tarot images, placeholder screenshot)
├─ personae-json/   # Persona definitions and metadata
├─ components.json  # shadcn/ui component registry
├─ package.json
└─ ...              # configs, PDFs and other resources
```

## Persona & Tarot Resources

- `personae-json/` holds persona data you can expand.
- `public/tarot/` hosts tarot assets for the app.
- Sample tarot readings reside in the `StarpathVision – Tarot Golden Outputs` PDFs at the project root.

For further inspiration on tarot meanings or persona creation, explore resources like [Biddy Tarot](https://www.biddytarot.com/) or [Persona Patterns](https://personapatterns.com/).

## Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Deployment

A `vercel.json` configuration is provided for easy deployment to [Vercel](https://vercel.com/). Update the screenshot above or include a live deployment link when available.


# AT Protocol Migration Tool

A web application for interacting with the AT Protocol, built with React and Vite.

## Features

- User authentication with AT Protocol
- Display of user information including handle, PDS host, DID, and DID document
- Modern UI with Tailwind CSS

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment to Cloudflare Pages

1. Push your code to a Git repository
2. In Cloudflare Pages:
   - Create a new project
   - Connect your Git repository
   - Set the build command to: `npm run build`
   - Set the build output directory to: `dist`
   - Deploy!

## Environment Variables

No environment variables are required for this application.

## License

MIT

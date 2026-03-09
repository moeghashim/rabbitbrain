# Rabbitbrain Chrome Extension Release

## Local Development

1. Install dependencies with `npm install`.
2. Start the web app with `npm run -w @pi-starter/web dev`.
3. Start the extension dev server with `npm run extension:dev`.
4. Load the unpacked extension from `apps/extension/dist` in Chrome.

## Production Packaging

1. Build the production extension with `npm run extension:package`.
2. Confirm the artifact exists at `apps/extension/dist/rabbitbrain-for-x-<version>.zip`.
3. Confirm the production manifest contains:
   - `storage`
   - `https://x.com/*`
   - `https://www.rabbitbrain.app/*`
4. Confirm `http://localhost:3000/*` is absent from the packaged manifest.

## Chrome Web Store Checklist

1. Create or log into the Chrome Web Store publisher account.
2. Upload the packaged zip to create the listing.
3. Set visibility to `Public` and enable deferred publishing.
4. Fill the listing with the prepared title, description, screenshots, promo image, privacy answers, support URL, and privacy policy URL.
5. Add reviewer instructions covering:
   - install on desktop Chrome
   - visit `https://x.com`
   - click `Analyze`
   - sign in with X when prompted
   - verify inline analysis and bookmark save
6. After approval, publish the staged release and verify install, sign-in, analysis, and bookmarking from the live store item.

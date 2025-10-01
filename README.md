# Easy Read Document Generator

A UI design prototype for the Easy Read Document Generator. This project demonstrates a responsive interface and mock data handling for document creation.

## Getting Started

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Run the development server:**

   ```sh
   npm run dev
   ```

3. **Build for production:**

   ```sh
   npm run build
   ```

## Mock Data & API

Mock APIs are provided in `/src/app/api` for experimenting with dynamic content loading. These are placeholders and should be replaced with real backend APIs in production.

Currently, only data fetching is implemented via mock APIs; updates are handled locally on the page. When integrating a backend, these mechanisms may need to be rewritten. Using [SWR](https://swr.vercel.app/) for API data fetching is recommended.

## Design Reference

Figma files are available in the [figma/](figma/) folder. These serve as visual references only; for actual functionality, refer to the source code.

## Folder Structure

- `src/app/` – Application pages and routing
- `src/components/` – UI components
- `src/lib/` – Utility libraries
- `src/stores/` – State management
- `figma/` – Figma design files

## License

This is a private demonstration project. The authors reserve all rights to the code. Images in the repository are placeholders and will be removed in the final product. If you believe any image infringes your rights, please contact the authors by raising an issue.

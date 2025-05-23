# Project Name: nextn

## Overview

This project is a Next.js application bootstrapped with `create-next-app`. It utilizes Genkit for AI-powered features and a variety of UI components from Radix UI and other libraries. The application is designed to be a wizard-like interface, guiding users through a series of steps.

## Tech Stack

* **Framework:** Next.js 15.2.3
* **AI:** Genkit with Google AI
* **UI Components:**
    * Radix UI (Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Label, Menubar, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Slot, Switch, Tabs, Toast, Tooltip)
    * Shadcn UI (likely, given the component structure and Radix UI usage)
* **Forms:** React Hook Form with Zod for validation
* **Data Fetching/State Management:** React Query (potentially with Firebase integration, given `@tanstack-query-firebase/react`)
* **Styling:** Tailwind CSS
* **Language:** TypeScript
* **Package Manager:** npm (implied by `package-lock.json`)

## Key Features (Inferred from file structure and dependencies)

* **AI-Powered Flows:**
    * Recommendation Introduction Generation
    * Company Details Prefilling
    * Incorporation Recommendation
    * Business Description Summarization
* **Wizard Interface:** A multi-step process for users, indicated by `src/components/wizard/steps/`.
    * Step 1: Define & Configure
    * Step 2: Provide Details & Select Services
    * Step 3: Review & Pay
    * Step 4: Confirmation
* **User Interface:**
    * Responsive design (indicated by `use-mobile.tsx`)
    * Toasts for notifications
    * Various UI elements like accordions, dialogs, forms, charts, etc.
* **Development Tools:**
    * `genkit start` for running Genkit flows.
    * `next dev --turbopack` for fast development server.
    * ESLint for linting.
    * TypeScript for static typing.

## Project Structure Highlights

* **`src/ai/`**: Contains Genkit AI flow definitions and development server (`dev.ts`, `genkit.ts`).
    * **`src/ai/flows/`**: Specific AI-driven functionalities.
* **`src/app/`**: Core Next.js application files (layout, pages, global styles).
* **`src/components/`**: Reusable UI components.
    * **`src/components/common/`**: General-purpose UI components (e.g., `TypingText.tsx`).
    * **`src/components/ui/`**: Likely Shadcn UI components or custom UI elements based on Radix UI.
    * **`src/components/wizard/`**: Components specific to the wizard interface (layout, steps, header, order summary, progress bar).
* **`src/hooks/`**: Custom React hooks (e.g., `use-mobile.tsx`, `use-toast.ts`).
* **`src/lib/`**: Utility functions and type definitions.
* **`docs/`**: Documentation files (e.g., `blueprint.md`).
* **`.idx/`**: Project IDX specific configuration.
* **`.vscode/`**: VS Code editor settings.

## Getting Started

### Prerequisites

* Node.js (version compatible with Next.js 15)
* npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd nextn
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

1.  **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.

2.  **Run the Genkit development server (if working on AI flows):**
    ```bash
    npm run genkit:dev
    ```
    Or, for watching changes:
    ```bash
    npm run genkit:watch
    ```

### Building for Production

```bash
npm run build
```

### Starting the Production Server

```bash
npm run start
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Available Scripts

*   `dev`: Starts the Next.js development server with Turbopack on port 9002.
*   `genkit:dev`: Starts the Genkit development server.
*   `genkit:watch`: Starts the Genkit development server with file watching.
*   `build`: Builds the Next.js application for production.
*   `start`: Starts the Next.js production server.
*   `lint`: Lints the codebase using Next.js's ESLint configuration.
*   `typecheck`: Runs TypeScript type checking.

## Dependencies Overview

*   **`@genkit-ai/googleai` & `@genkit-ai/next`**: Integration of Genkit with Google AI services and Next.js.
*   **`@hookform/resolvers` & `react-hook-form`**: For managing forms and validation.
*   **`@radix-ui/*`**: A suite of accessible, unstyled UI primitives.
*   **`@tanstack/react-query`**: For server-state management, data fetching, and caching.
*   **`class-variance-authority` & `clsx` & `tailwind-merge`**: Utilities for managing CSS classes, especially with Tailwind CSS.
*   **`date-fns`**: For date manipulation.
*   **`dotenv`**: For managing environment variables.
*   **`firebase`**: Google's Firebase platform (usage might be for auth, database, etc., used with React Query).
*   **`lucide-react`**: Icon library.
*   **`next`**: The React framework for production.
*   **`patch-package`**: For applying patches to npm dependencies.
*   **`react` & `react-dom`**: Core React libraries.
*   **`recharts`**: Composable charting library.
*   **`zod`**: TypeScript-first schema declaration and validation library.

## Dev Dependencies Overview

*   **`@types/*`**: TypeScript type definitions for various libraries.
*   **`genkit-cli`**: Command-line interface for Genkit.
*   **`postcss` & `tailwindcss`**: For CSS preprocessing and utility-first CSS framework.
*   **`typescript`**: The TypeScript language.

## Further Information

*   Check the `docs/blueprint.md` for more detailed project architecture or design decisions.
*   The Genkit flows in `src/ai/flows/` provide insight into the AI capabilities of the application.
*   The wizard components in `src/components/wizard/` illustrate the user journey.

This README provides a comprehensive overview of the "nextn" project. For more specific details, please refer to the codebase and the linked documentation.

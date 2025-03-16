
# Welcome to your Lovable project

## Version
Current version: 1.2.3 (See version.txt for updates)

## Project info

**URL**: https://lovable.dev/projects/8091c9f8-9c41-4ac3-b2fc-91397b8433b0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8091c9f8-9c41-4ac3-b2fc-91397b8433b0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Setting up on a new machine

To set up this project on a new machine (Windows or Mac), follow these steps:

### Prerequisites

#### For Windows:
1. **Install Node.js**: 
   - Download the installer from [Node.js website](https://nodejs.org/) (v16 or higher recommended)
   - Follow the installation wizard
   - Verify installation by opening Command Prompt and typing:
     ```
     node --version
     npm --version
     ```

2. **Install Git**:
   - Download the installer from [Git website](https://git-scm.com/download/win)
   - Follow the installation wizard with default options
   - Verify installation by opening Command Prompt and typing:
     ```
     git --version
     ```

#### For Mac:
1. **Install Node.js**:
   - Using Homebrew (recommended):
     ```
     brew install node
     ```
   - Or download the installer from [Node.js website](https://nodejs.org/)
   - Verify installation by opening Terminal and typing:
     ```
     node --version
     npm --version
     ```

2. **Install Git**:
   - Using Homebrew:
     ```
     brew install git
     ```
   - Or download from [Git website](https://git-scm.com/download/mac)
   - Verify installation by opening Terminal and typing:
     ```
     git --version
     ```

### Setting up the project

1. **Clone the repository**:
   ```sh
   git clone <YOUR_REPOSITORY_URL>
   cd <PROJECT_DIRECTORY>
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Start the development server**:
   ```sh
   npm run dev
   ```
   This will automatically:
   - Start the application
   - Open your default browser to http://localhost:8080 (if it doesn't open automatically, you can manually navigate to this URL)
   - Enable hot-reloading, so any changes you make to the code will be immediately reflected in the browser

4. **For production build**:
   ```sh
   npm run build
   ```
   This creates optimized production files in the `dist` directory.

5. **To preview the production build locally**:
   ```sh
   npm run preview
   ```

### Troubleshooting Common Issues

- **Port already in use**: If port 8080 is already being used by another application, you can modify the port in `vite.config.ts` file
- **Node version issues**: This project requires Node.js v16 or higher. Use `nvm` to manage multiple Node versions if needed
- **Dependencies installation errors**: Try removing `node_modules` folder and `package-lock.json` file, then run `npm install` again

## Version Control

This project uses Git for version control. To maintain a clear history:

1. **Commit regularly with meaningful messages**:
   ```sh
   git add .
   git commit -m "A clear description of changes"
   ```

2. **Push changes to update the Lovable project**:
   ```sh
   git push origin main
   ```

3. **Check the version in version.txt to track major updates**

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8091c9f8-9c41-4ac3-b2fc-91397b8433b0) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

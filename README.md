# Smart Civic Issue Reporting Platform

# Project Overview

The Smart Civic Issue Reporting Platform is a modern civic engagement system designed to help citizens report city infrastructure problems quickly and efficiently.

Citizens can submit reports using photos and location data. The system analyzes the issue, aggregates community confirmations, and routes the complaint to the appropriate municipal department. Authorities manage incoming reports through a dedicated dashboard where they can review issues, track progress, upload resolution proof, and mark tasks as completed.

The platform promotes transparency, faster response times, and better communication between citizens and municipal authorities.

# Getting Started
Prerequisites

Make sure the following are installed on your system:
Node.js (v18 or later recommended)
npm or yarn
Git

# Installation
Clone the repository and install dependencies.
# Clone the repository
git clone (https://github.com/Abdul-syfer/civisence)
# Navigate to the project directory
cd civisence
# Install dependencies
npm install


# Running the Development Server
Start the local development environment.
npm run dev

The application will start with hot reloading enabled.
Open your browser and navigate to the local development URL displayed in the terminal.

# Project Structure
src/
components/        Reusable UI components
pages/             Application pages
features/          Feature modules
hooks/             Custom React hooks
services/          API and backend communication
utils/             Helper functions
assets/            Static assets

# Technology Stack
The project is built using modern web technologies:
React
TypeScript
Vite
Tailwind CSS
shadcn/ui

# Build for Production
To create a production build:
npm run build

# To preview the production build locally:
npm run preview

# Deployment

The application can be deployed to any modern hosting platform that supports static or frontend deployments, such as:

Vercel
Netlify
AWS
DigitalOcean
Cloudflare Pages

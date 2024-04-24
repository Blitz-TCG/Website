# Blitz TCG Website

Welcome to the official repository for the Blitz TCG® website, the digital front door to an innovative trading card game experience. This repository holds the open-source codebase for the website that supports Blitz TCG®, a game that uses blockchain technology to redefine the competitive trading card scene by enabling digital ownership and extending the longevity of game assets for players.

## Website Overview

The Blitz TCG® website is designed to complement the game's innovative features by providing an engaging online presence. It showcases the game's rich lore, intricate mechanics, and serves as a hub for community interaction and news updates.

## Getting Started with the Website Codebase

To start contributing to the Blitz TCG® website, follow these steps:
1. Clone the repository to your local machine.
2. Ensure you have Node.js and Angular CLI installed to run the project.
3. Install the project dependencies by running `npm install` or `yarn install` in the project directory.

Before you start the development server:
- You must obtain your own Firebase configuration files (`firebase.json`, `firestore.rules`, etc.), as these have been removed from the repository for security reasons.
- You will also need to set up local environment variables for development, which are not tracked in this repository. Refer to the `.env.example` files to create your `.env` configurations.
- To run the development server, execute `ng serve` and navigate to `http://localhost:4200/`.

## Security Measures

In the spirit of open source, we have taken steps to ensure that no sensitive information is present within the repository. The following types of files have been excluded and purged from the history for security reasons:
- Firebase configuration and rules files
- Local `.env` files containing sensitive environment variables
- Production environment files within `src/environments`
- Service files that may contain API keys or sensitive logic
- Server-side code that may contain sensitive information

Please ensure that you maintain this security stance by not committing sensitive configurations to your public repositories.

## Contribution Guidelines

We welcome contributions from the community. To contribute:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to your branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

For more detailed instructions, refer to our contribution guide in the `CONTRIBUTING.md` file.

## Licensing

The code within this repository is made available under the terms and conditions outlined in the `LICENSE` file. For any use of proprietary assets associated with Blitz TCG®, please adhere to the guidelines stated within the game client's repository.

## Acknowledgments

Blitz TCG® and its online presence are initiatives of 16-Bit Hero, LLC. We are grateful for the contributions and support from our dynamic community that helps to enrich the Blitz TCG® ecosystem.

## Further Information and Support

For a deeper understanding of Blitz TCG®'s unique gameplay and the technology behind it, please refer to our [Whitepaper](https://blitztcg.com/whitepaper). Should you need assistance or wish to connect with our community, join us on [Discord](https://discord.com/invite/KkuDscjVt2) or reach out via our [social channels](https://linktr.ee/blitztcg).

---

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.6.

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running Unit Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running End-to-End Tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

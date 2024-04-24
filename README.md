# Blitz TCG Website
The Blitz TCG® website is designed to complement the game's innovative features by providing an engaging online presence. It showcases the game's rich lore, intricate mechanics, and serves as a hub for community interaction and news updates.

# Getting Started
To start contributing to the Blitz TCG® website, follow these steps:
1. Clone the repository to your local machine.
2. Ensure you have Node.js and Angular CLI installed to run the project.
3. Install the project dependencies by running `npm install` or `yarn install` in the project directory.

# Before you start the development server:
- You must obtain your own Firebase configuration files (`firebase.json`, `firestore.rules`, etc.), as these have been removed from the repository for security reasons.
- You will also need to set up local environment variables for development, which are not tracked in this repository. Reach out to us for help in creating your `.env` configurations.
- There are likely a few other firebase-specific items you will not have access to, so be aware that it will take some troubleshooting to stand up.
- To run the development server, execute `ng serve` and navigate to `http://localhost:4200/`.

# Security Measures
In the spirit of open source, we have taken steps to ensure that no sensitive information is present within the repository. The following types of files have been excluded and purged from the history for security reasons:
- Firebase configuration and rules files
- Local `.env` files containing sensitive environment variables
- Production environment files within `src/environments`
- Service files that may contain API keys or sensitive logic
- Server-side code that may contain sensitive information

Please ensure that you maintain this security stance by not committing sensitive configurations to your public repositories.

# Contribution
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would improve the game, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

We welcome contributions from the community. To contribute:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to your branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

# License
See the [Game Client Repo](https://github.com/Blitz-TCG/Game-Client) for information about licensing.

# Authors & Acknowledgments
Blitz TCG® is managed by 16-Bit Hero, LLC. We express our heartfelt thanks to everyone who has contributed to the growth and development of this innovative game.

# More Info
Explore the mechanics, lore, and strategic depth of Blitz TCG® in our comprehensive [Whitepaper](https://blitztcg.com/whitepaper). Dive into the theories behind the mechanics, tokenomics, and our rich game lore to better understand the foundational pillars of our game's design.

# Support
For support, please join our [Discord](https://discord.com/invite/KkuDscjVt2) or reach out on our other [socials](https://linktr.ee/blitztcg).

---

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.6.

## Development Server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code Scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running Unit Tests
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running End-to-End Tests
Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further Help
To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

# wiseBite chrome extension




chrome extension system design diagram:
![alt text](<chrome-ext sys design-1.png>) 


 


# WiseBite
WiseBite is an AI-enabled smart label reader that helps consumers understand the health impact of packaged food products and encourages them to make healthier choices.

### Features
Analyzes the health impact of food products based on their ingredients.
Provides actionable insights and nudges for making better consumption choices.
Simple interface to analyze products directly from the page or via URL input.

### Installation
Clone the repository and navigate to the project directory.


 
git clone <repository-url>
cd wisebite

Install the necessary dependencies:

npm install

Build the extension:
 
npm run build

Upload the dist folder to Chrome as an unpacked extension:

Open Chrome and navigate to chrome://extensions/.
Enable "Developer mode" in the top right corner.
Click "Load unpacked" and select the dist folder from your project directory.
How to Use the Extension
Navigate to the Product Page: Go to the product page you want to analyze.

Analyze the Page: Click on the extension icon and analyze the page directly, or copy and paste the product URL into the extension.

Keep the Extension Open: Once you open the extension, keep it open by avoiding clicks elsewhere on the screen to maintain the session.

Reload if Necessary: If the extension displays an error, try reloading the product page and reanalyzing.

### Troubleshooting
If you encounter errors while using the extension, ensure that the product page is fully loaded before attempting to analyze it again.
Reloading the product page can help resolve some common errors related to page content changes or incomplete data loads.
Contributing
Contributions are welcome! Please fork the repository, make your changes, and submit a pull request for review.

### License
This project is licensed under the MIT License - see the LICENSE file for details.


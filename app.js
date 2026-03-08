const puppeteer = require('puppeteer');
const fs = require('fs');

// TODO: Load the credentials from the 'credentials.json' file
// HINT: Use the 'fs' module to read and parse the file
const fileData = fs.readFileSync('./credentials.json', 'utf-8');
const credentials = JSON.parse(fileData);

(async () => {
    // TODO: Launch a browser instance and open a new page
    // We set headless: false so you can see the browser working!
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to GitHub login page
    await page.goto('https://github.com/login');

    // TODO: Login to GitHub using the provided credentials
    // HINT: Use the 'type' method to input username and password, then click on the submit button
    await page.type('#login_field', credentials.username); // Type username
    await page.type('#password', credentials.password);    // Type password
    await page.click('input[name="commit"]');             // Click Sign In

    // Wait for successful login
    // We wait for the user avatar at the top right to know we are in
    await page.waitForSelector('.avatar.circle');

    // Extract the actual GitHub username to be used later
    const actualUsername = await page.$eval('meta[name="octolytics-actor-login"]', meta => meta.content);

    const repositories = ["cheeriojs/cheerio", "axios/axios", "puppeteer/puppeteer"];

for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Star the repository
        await page.waitForSelector('.js-social-form .js-toggler-target'); 
        await page.click('.js-social-form .js-toggler-target');
        
        // This is the new way to wait for 2 seconds
        await new Promise(r => setTimeout(r, 2000)); 
    }

    // TODO: Navigate to the user's starred repositories page
    await page.goto(`https://github.com/${actualUsername}?tab=stars`);

    // TODO: Click on the "Create list" button
    // This button opens the "Create a new list" popup
    await page.waitForSelector('button[data-show-dialog-id="lists-create-dialog"]');
    await page.click('button[data-show-dialog-id="lists-create-dialog"]');

    // TODO: Create a list named "Node Libraries"
    // HINT: Wait for the input field and type the list name
    await page.waitForSelector('input[name="list[name]"]');
    await page.type('input[name="list[name]"]', 'Node Libraries');

    // Wait for buttons to become visible
    await page.waitForTimeout(1000);

    // Identify and click the "Create" button
    const buttons = await page.$$('.Button--primary.Button--medium.Button');
    for (const button of buttons) {
        const buttonText = await button.evaluate(node => node.textContent.trim());
        if (buttonText === 'Create') {
            await button.click();
            break;
        }
    }

    // Allow some time for the list creation process
    await page.waitForTimeout(2000);

    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Add this repository to the "Node Libraries" list
        // HINT: Open the dropdown, wait for it to load, and find the list by its name
        const dropdownSelector = 'summary[aria-label="Add to list"]';
        await page.waitForSelector(dropdownSelector);
        await page.click(dropdownSelector); // 1. Click the little arrow next to "Starred"
        
        await page.waitForSelector('.js-user-list-menu-form'); // 2. Wait for the list menu to open
        
        const lists = await page.$$('.js-user-list-menu-form');

        for (const list of lists) {
          const textHandle = await list.getProperty('innerText');
          const text = await textHandle.jsonValue();
          if (text.includes('Node Libraries')) {
            await list.click(); // 3. Click the checkbox for our new list
            break;
          }
        }

        // Allow some time for the action to process
        await page.waitForTimeout(1000);

        // Close the dropdown to finalize the addition to the list
        await page.click(dropdownSelector);
      }

    // Close the browser
    await browser.close();
    console.log("All done! Check your GitHub stars!");
})();
const puppeteer = require('puppeteer');
const fs = require('fs');

// TODO: Load the credentials from the 'credentials.json' file
// HINT: Use the 'fs' module to read and parse the file
const fileData = fs.readFileSync('./credentials.json', 'utf-8');
const credentials = JSON.parse(fileData);

(async () => {
    // TODO: Launch a browser instance and open a new page
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized'] 
    });
    const page = await browser.newPage();

    // Custom helper to fix the version error
    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    // Navigate to GitHub login page
    await page.goto('https://github.com/login');

    // TODO: Login to GitHub using the provided credentials
    // HINT: Use the 'type' method to input username and password, then click on the submit button
    await page.waitForSelector('#login_field');
    await page.type('#login_field', credentials.username);
    await page.type('#password', credentials.password);
    await page.click('input[name="commit"]');

    // Wait for successful login
    await page.waitForSelector('.avatar.circle');

    // Extract the actual GitHub username to be used later
    const actualUsername = await page.$eval('meta[name="octolytics-actor-login"]', meta => meta.content);

    const repositories = ["cheeriojs/cheerio", "axios/axios", "puppeteer/puppeteer"];

    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Star the repository
        // HINT: Use selectors to identify and click on the star button
        const starButton = 'button[aria-label^="Star this repository"]';
        await page.waitForSelector(starButton);
        await page.click(starButton);
        
        await wait(2000); // This timeout helps ensure that the action is fully processed
    }

    // TODO: Navigate to the user's starred repositories page
    await page.goto(`https://github.com/${actualUsername}?tab=stars`);

    // TODO: Click on the "Create list" button
    const createListBtn = 'button[data-show-dialog-id="lists-create-dialog"]';
    await page.waitForSelector(createListBtn);
    await page.click(createListBtn);

    // TODO: Create a list named "Node Libraries"
    // HINT: Wait for the input field and type the list name
    await page.waitForSelector('input[name="list[name]"]');
    await page.type('input[name="list[name]"]', 'Node Libraries');

    // Wait for buttons to become visible
    await wait(1000);

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
    await wait(2000);

    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Add this repository to the "Node Libraries" list
        // HINT: Open the dropdown, wait for it to load, and find the list by its name
        const dropdownSelector = 'summary[aria-label="Add to list"]';
        await page.waitForSelector(dropdownSelector);
        await page.click(dropdownSelector);
        
        await page.waitForSelector('.js-user-list-menu-form');
        
        const lists = await page.$$('.js-user-list-menu-form');

        for (const list of lists) {
          const textHandle = await list.getProperty('innerText');
          const text = await textHandle.jsonValue();
          if (text.includes('Node Libraries')) {
            await list.click();
            break;
          }
        }

        // Allow some time for the action to process
        await wait(1000);

        // Close the dropdown to finalize the addition to the list
        await page.click(dropdownSelector);
      }

    // Close the browser
    await browser.close();
})();
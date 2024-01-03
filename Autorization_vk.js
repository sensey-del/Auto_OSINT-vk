const puppeteer = require('puppeteer');
require('dotenv').config();

  const loginToVK = async (page) => {
  try {
    await page.goto('https://vk.com/login');
    await page.waitForSelector('#index_email');
    await page.type('#index_email', process.env.VK_LOGIN || 'default_login');
    await page.keyboard.press('Enter')
    await page.waitForTimeout(20000);
    } catch (error) {
    console.error('Ошибка в LoginToVk', error);
    }
  };

module.exports = loginToVK;
const puppeteer = require('puppeteer');

  const loginToVK = async (page) => {

  try {
    await page.goto('https://vk.com/login');
    await page.waitForSelector('#index_email');
    await page.type('#index_email', '89117243799'); // Замените 'ВАШ_ЛОГИН' на реальный логин
    await page.keyboard.press('Enter')
    await page.waitForTimeout(15000)
    await page.waitForNavigation();
    } catch (error) {
    console.error('Ошибка:', error);
    }
  };
  
module.exports = loginToVK;
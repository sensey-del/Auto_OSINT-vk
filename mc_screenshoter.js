const puppeteer = require("puppeteer");
const loginToVK = require('./Autorization_vk');
const fs = require("fs");
const moment = require("moment");



(async () => {
  const folderName = moment().format("YYYY-MM-DD_HH-mm-ss");
  fs.mkdirSync(folderName);

const links = [
"https://vk.com/id211823541",
"https://vk.com/id228379580",
"https://vk.com/id227534468"
];


  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }); 
  const page = await browser.newPage();

  await loginToVK(page); // Вызов функции авторизации

  // Для каждой ссылки
  for (let link of links) {
    await page.goto(link);
    await page.waitForTimeout(8000); // Ждем 8 секунд

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(8000); // Ждем 8 секунд

    // Создаем скриншот и сохраняем его в папку с именем ссылки
    const screenshotName = link.replace("https://", "").replace("/", "_") + ".png";
    await page.screenshot({ path: `${folderName}/${screenshotName}`, fullPage: true });
  }

  // Закрываем браузер после сбора скриншотов
  await browser.close();
})();
const puppeteer = require("puppeteer");
const loginToVK = require('./Autorization_vk');
const fs = require("fs");
const moment = require("moment");



(async () => {
  const folderName = moment().format("YYYY-MM-DD_HH-mm-ss");
  fs.mkdirSync(folderName);

const links = [
"links",
"links",
"links"
];


  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }); 
  const page = await browser.newPage();

  await loginToVK(page); // Вызов функции авторизации

  // Для каждой ссылки
  for (let link of links) {
    await page.goto(link);
    await page.waitForTimeout(10000); // Ждем 10 секунд

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(5000); // Ждем 5 секунд

    // Создаем скриншот и сохраняем его в папку с именем ссылки
    const screenshotName = link.replace("https://", "").replace("/", "_") + ".png";
    await page.screenshot({ path: `${folderName}/${screenshotName}`, fullPage: true });
  }

  // Закрываем браузер после сбора скриншотов
  await browser.close();
})();

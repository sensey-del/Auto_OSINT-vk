const puppeteer = require("puppeteer");
const loginToVK = require('./Autorization_vk');
const fs = require("fs");
const moment = require("moment");
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  // Подключение к БД
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME 
  });

  const [rows, fields] = await connection.execute('SELECT link FROM osint_list');
  
  const links = rows.map(row => row.link);

  const folderName = moment().format("YYYY-MM-DD_HH-mm-ss");
  fs.mkdirSync(folderName);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await loginToVK(page); // Вызов функции авторизации

  // Для каждой ссылки
  for (let link of links) {
    await page.goto(link);
    await page.waitFor(8000); // Ждем 8 секунд

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitFor(8000); // Ждем 8 секунд

    // Создаем скриншот и сохраняем его в папку с именем ссылки
    const screenshotName = link.replace("https://", "").replace("/", "_") + ".png";
    await page.screenshot({ path: `${folderName}/${screenshotName}`, fullPage: true });

    // Добавление данных в базу данных
    const [results, fields] = await connection.execute(
      'INSERT INTO osint_list (ссылка, путь_к_скриншоту) VALUES (?, ?)',
      [link, `${folderName}/${screenshotName}`]
    );
    console.log('Добавлено в базу данных:', results);
  }

  // Закрываем браузер после сбора скриншотов
  await browser.close();
})();

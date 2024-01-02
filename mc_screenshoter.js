const puppeteer = require("puppeteer");
const loginToVK = require('./Autorization_vk');
const fs = require("fs");
const moment = require("moment");
const mysql = require('mysql2/promise');
require('dotenv').config();

  // Подключение к БД
async function createConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
  });
  console.log('Есть контакт!');
  return connection;
} catch (err) {
  console.error('Факинг еррор при подключении к БД', err.message)
  throw err;
  }
}

async function connectWithRetry() {
  while (true) {
    try {
      return await createConnection();
    } catch (err) {
      console.log('Повторная попытка подключения через 2 секунды...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

(async () => { 
  const connection = await connectWithRetry();

  const [rows, fields] = await connection.execute('SELECT link FROM osint_links');
  const links = rows.map(row => row.link);

  const folderName = moment().format("YYYY-MM-DD_HH-mm-ss");
  fs.mkdirSync(folderName);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await loginToVK(page); // Вызов функции авторизации

  // Для каждой ссылки
  for (let link of links) {
    try {
      await page.goto(link);
      await page.waitForSelector('h2#owner_page_name');

      const urlParts = link.split('/').pop();
      const profileName = await page.$eval('h2#owner_page_name', element => element.textContent.trim());
      
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page.waitForTimeout(8000);

    // Создаем скриншот и сохраняем его в папку с именем ссылки

    const screenshotName = `${userId}_${profileName}.png`; // Имя файла скриншота
    await page.screenshot({ path: `${folderName}/${screenshotName}`, fullPage: true });

    // Добавление данных в базу данных
    const [results, fields] = await connection.execute(
      'INSERT INTO osint_list (link, path_to_screenshot, name, lastName) VALUES (?, ?, ?, ?)',
      [link, `${folderName}/${screenshotName}` , firstName, lastName]
    );
    console.log('Добавлено в базу данных:', results);
  } catch (error) {
    console.error('ошибка при обработке страницы', error.message);
  }
}

  // Закрываем браузер после сбора скриншотов
  await browser.close();
  console.log('Обработка завершена. Браузер офф');
})();

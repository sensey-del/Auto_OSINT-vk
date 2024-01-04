const puppeteer = require("puppeteer");
const loginToVK = require('./Autorization_vk');
const fs = require("fs");
const moment = require("moment");
const mysql = require('mysql2/promise');
const { error } = require("console");
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


  // Повоторная попытка подключения к БД
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



//Функция проверки сущетсвующих ссылок в БД
async function checkIfLinkExists(connection, link) {
  const [rows, _] = await connection.execute('SELECT * FROM osint_links WHERE link = ?', [link]);
  return rows.length > 0 ? rows[0] : null;
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
      const userId = urlParts[urlParts.length - 1];
      const profileName = await page.$eval('h2#owner_page_name', element => element.textContent.trim());
      const nameParts = profileName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });



    await page.waitFor(500);
    const screenshotName = `${userId}_${profileName.replace(/ /g, '_')}.png`; // Имя файла скриншота
    await page.screenshot({ path: `${folderName}/${screenshotName}`, fullPage: true });

  const linkExists = await checkIfLinkExists(connection, link);
  if (!linkExists || (linkExists.length > 0 && linkExists[0].path_to_screenshot && !linkExists[0].name && !linkExists[0].lastName)) {
    const insertQuery = `
    INSERT INTO osint_links (link, path_to_screenshot, name, lastName)
    VALUES (?, ?, ?, ?)
  `;
  await connection.execute(insertQuery, [link, folderName, firstName, lastName]);
    console.log('Добавлена новая запись ссылка в БД', link);
  } else {
    //Уже есть ссылка
    const updateQuery = `
    UPDATE osint_links
    SET path_to_screenshot = COALESCE(?, path_to_screenshot),
        name = COALESCE(?, name),
        lastName = COALESCE(?, lastName)
    WHERE link = ?
    `;
    await connection.execute(updateQuery, [folderName, firstName, lastName, link]);
    console.log('Обновлены значения для сслыки', link);
    } 
  }catch (error) {
    console.error('Ошибка при обработки странициы', error.message);
  }
  }
  await browser.close();
  console.log('Обработка завершена. Браузер офф');
})();

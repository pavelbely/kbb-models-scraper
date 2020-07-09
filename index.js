const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');

const getSelectOptions = (page, selector) => page.$$eval(selector, els => els.map(e => e.textContent));

const scrapeMake = async (page, make) => {
  await page.select('#content form .make select', make);

  await page.waitFor(3000);

  const models = await getSelectOptions(page, '#content form .model select option:not([disabled])');

  return { make, models };
}

function* scrapeMakes(page, makes) {
  for (make of makes) {
    yield scrapeMake(page, make);
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto('https://www.kbb.com/car-prices/');

  const makeNames = await getSelectOptions(page, '#content form .make select option:not([disabled])');
  const makes = [];
  for await (let make of scrapeMakes(page, makeNames)) {
    makes.push(make);
  }

  const allModels = [].concat(
    ...makes.map(
      ({ make, models }) => models.map(model => ({ make, model }))
    )
  );

  const csvWriter = createObjectCsvWriter({
    path: 'kbb-models.csv',
    header: [
      { id: 'make', name: 'MAKE' },
      { id: 'model', name: 'MODEL' },
    ],
  });

  csvWriter.writeRecords(allModels);

  browser.close();
}

run();

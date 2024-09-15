const puppeteer = require("puppeteer");
const fs = require("fs");

const url = "https://willianjusten.com.br";

async function scroollToBottom(page) {
  const previousHeight = await page.evaluate("document.body.scrollHeight");
  await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
  await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, {
    timeout: 1000,
  });
}

async function loadAllPosts(page) {
  let initialPosts = 0;
  let postsAfterScrollCount = 0;
  while (true) {
    try {
      await scroollToBottom(page);
    } catch (error) {
      console.log("Infinite Scroll Finished");
      break;
    }
    postsAfterScrollCount = (await page.$$("a[class*='PostLink']")).length;

    if (initialPosts === postsAfterScrollCount) {
      break;
    }
  }
}

const appendPostOnCsv = (post) => {
  fs.appendFileSync(
    "./src/posts.csv",
    `${post.title};${post.link}\n`,
    function (err) {
      if (err) throw err;
    }
  );
};

async function extractPosts(page) {
  const posts = await page.$$("a[class*='PostLink']");
  const items = [];

  for (let element of posts) {
    appendPostOnCsv({
      title: await element.evaluate(
        (post) => post.querySelector("h1").textContent
      ),
      link: `${url}/${await element.evaluate((post) =>
        post.getAttribute("href")
      )}`,
    });
  }
  return items;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  await page.goto("https://willianjusten.com.br");
  await page.waitForSelector(".infinite-scroll-component");

  await loadAllPosts(page);
  await extractPosts(page);

  await browser.close();
})();

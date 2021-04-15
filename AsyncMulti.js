require("chromedriver"); 
const wd = require("selenium-webdriver");
let browser = new wd.Builder().forBrowser("chrome").build();
const fs = require("fs");
let matchId = process.argv[2];
let innings = process.argv[3];
let batsmenUrl = [];
let bowlerUrl = [];
let careerData = [];

let playersAdded = 0;

async function main() {
    await browser.get("https://www.cricbuzz.com/cricket-scores/" + matchId);
    await browser.wait(wd.until.elementLocated(wd.By.css(".cb-nav-bar a")));
    let buttons = await browser.findElements(wd.By.css(".cb-nav-bar a"));

    await buttons[1].click();
    await browser.wait(wd.until.elementLocated(wd.By.css("#innings_" + innings + "" + " .cb-col.cb-col-100.cb-ltst-wgt-hdr")));
    let tables = await browser.findElements(wd.By.css("#innings_" + innings + "" + " .cb-col.cb-col-100.cb-ltst-wgt-hdr"));
    let inningsBatsmenRows = await tables[0].findElements(wd.By.css(".cb-col.cb-col-100.cb-scrd-itms"));
    for(let i=0; i<inningsBatsmenRows.length; i++) {
        let columns = await inningsBatsmenRows[i].findElements(wd.By.css("div"));
        if(columns.length == 7) {
            let url = await columns[0].findElement(wd.By.css("a")).getAttribute("href");
            let playerName = await (await columns[0].findElement(wd.By.css("a"))).getAttribute("innerText");
            batsmenUrl.push(url);
            careerData.push({"PlayerName" : playerName});
        }
        
    }

    let inningsBowlerRows = await tables[1].findElements(wd.By.css(".cb-col.cb-col-100.cb-scrd-itms"));
    for(let i=0; i < inningsBowlerRows.length; i++) {
        let columns = await inningsBowlerRows[i].findElements(wd.By.css("div"));
        let url = await columns[0].findElement(wd.By.css("a")).getAttribute("href");
        let playerName = await (await columns[0].findElement(wd.By.css("a"))).getAttribute("innerText");
        bowlerUrl.push(url);
        careerData.push({"PlayerName" : playerName});

    }

    let finalURL = batsmenUrl.concat(bowlerUrl);
    for(let i=0; i<finalURL.length; i++) {
        getData(finalURL[i], i, finalURL.length);
    }


    async function getData(url , i, totalPlayers) {
        let browser = new wd.Builder().forBrowser("chrome").build();
        await browser.get(url);
        await browser.wait(wd.until.elementLocated(wd.By.css("table")));
        let battingStatKey = [];
        let bowlingStatKey = [];
        let table = await browser.findElements(wd.By.css("table"));
        for(let j = 0; j<table.length; j++) {
            let tableKey = await table[j].findElements(wd.By.css("thead th"));
            for(let k = 1; k < tableKey.length; k++) {
                let title = await tableKey[k].getAttribute("title");
                title = title.split(" ").join("");
                if(j==0) {
                    battingStatKey.push(title);
                } else  {
                    bowlingStatKey.push(title);
                }
            }

            let DataRows = await table[j]. findElements(wd.By.css("tbody tr"));

            let Data = {};
            for(let k=0; k < DataRows.length; k ++) {
                let DataColumns = await DataRows[k].findElements(wd.By.css("td"));
                let matchType = await DataColumns[0].getAttribute("innerText");
                
                let temp = {};
                for(let l = 1; l < DataColumns.length; l++) {
                    let item = await DataColumns[l]. getAttribute("innerText");
                    temp[j == 0 ? battingStatKey[l-1] : bowlingStatKey[l-1]] = item;
                }

                Data[matchType] = temp;
            }

            careerData[i][j == 0 ? "battingCareer" : "bowlingCareer"] = Data;
        }

        playersAdded += 1;
        if(playersAdded == totalPlayers) {
            fs.writeFileSync("Career.json", JSON.stringify(careerData));
        }
        await browser.close();
    }

    await browser.close();
}


main();
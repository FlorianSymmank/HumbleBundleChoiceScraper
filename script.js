(async function hb_games_scraper() {

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    var entries = [];


    // All bought Games not redeemed on Keys & Entitlements Page
    // reset to page 1
    while (prev = $(".pagination:first").find(".hb-chevron-left")[0]) { (prev).click(); }
    // show only redeemed
    $("#hide-redeemed").prop("checked", true);

    while (next = $(".pagination:first").find("i.hb-chevron-right")[0]) {
        $("td.game-name h4").each((_g, h) => {
            if (!$(h).text().includes("Humble Choice"))
                entries.push($(h).text());
        });
        next.click();
    }
    $("td.game-name h4").each((_g, h) => { entries.push($(h).text()); });
    await sleep(1000)

    // All humble choices
    let humbleChoices = []
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    let currentyear = new Date().getFullYear();

    for (let year = 2019; year <= currentyear; year++) {
        for (let month = 0; month < 12; month++) {
            if (year == 2019 && month < 11) // started december 2019
                continue
            if (year == currentyear && month > new Date().getMonth() - 1)
                continue

            humbleChoices.push(monthNames[month] + "-" + year)
        }
    }

    for (let humbleChoice of humbleChoices) {
        const nw = window.open("/membership/" + humbleChoice, '_blank');
        window.focus(); // stay to current page
        // Listen for messages from the new window
        window.addEventListener('message', (event) => {
            if (event.source === nw) {
                for(let data of event.data)
                    entries.push(data)            
                nw.close();
            }
        });

        nw.onload = () => {
            // scrape in new window
            const scriptCode = `
                    let dataToSend = []
                    $("div.content-choice").each((_g, h) => {  
                        let text = $(h).text().trim()
                        if(!text.includes("Claimed")) // exclude claimed
                            dataToSend.push(text + " in " + window.location.href.split("/").at(-1))
                    })
                    window.opener.postMessage(dataToSend, '*');
                    window.close();
                `;

            // Create a script tag
            const scriptTag = nw.document.createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.textContent = scriptCode;

            // Inject the script into the new window's document
            nw.document.body.appendChild(scriptTag);
        };
        await sleep(2000) // basically wait for page to finish, theres probably a better way. problems that to many new tabs will be blocked by browser 
    };

    // output list to console
    entries = entries.sort()
    console.log(entries.join("\n"));
})();
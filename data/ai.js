const activeHandles = [];

const getAffordableUpgrades = () =>
    Array.from(document.querySelector('#upgrades').children).map((x) => x.dataset.id)
        .map(id => Game.UpgradesById[id])
        .map((x) => x).filter(x => x.unlocked === 1 && x.canBuy())

const getAffordableProducts = (cookiesToSpend) =>
    Array.from(document.querySelectorAll('#products .product'))
        .map((el, i) => ({el, i}))
        .filter(({el}) => el.classList.contains("unlocked") && !el.classList.contains('disabled'))
        .map(({i}) => Game.ObjectsById[i])

const purchaseUpgrades = () => {
    const affordableUpgrades = getAffordableUpgrades();
    if(affordableUpgrades.length === 0) {
        console.log(`No affordable upgrades to buy`);
        return;
    }
    affordableUpgrades.sort((a, b) => b.basePrice-a.basePrice);
    const [mostExpensiveUpgrade] = affordableUpgrades;
    console.log(`Purchasing the most expensive upgrade to buy: ${mostExpensiveUpgrade.name}`);
    mostExpensiveUpgrade.buy();
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

const getCenterFromBoundingRect = ({x, y, width ,height}) => ({
    x: x+(width/2),
    y: y+(height/2)
});


const instrumentCookieClicker = () => {
    const cookie = document.querySelector("#bigCookie");
    const {x, y} = getCenterFromBoundingRect(cookie.getBoundingClientRect());
    Game.GetMouseCoords({pageX: x, pageY: y});
    activeHandles.push(setInterval(() => {
        cookie.click();
    }, 1))
}

const purchaseProducts = () => {
    const affordableProducts = getAffordableProducts(Game.cookies);
    if(affordableProducts.length === 0) {
        console.log(`no affordable products to buy`)
        return;
    }
    affordableProducts.sort((a, b) => b.getPrice()-a.getPrice());
    const [mostExpensiveProduct] = affordableProducts;
    console.log(`Purchasing the most expensive product to buy: ${mostExpensiveProduct.name}`);
    mostExpensiveProduct.buy();
}

const doVariableTasks = () => {
    const roll = getRandomInt(0, 201);
    if(roll >= 0 && roll <= 20){
        purchaseProducts();
    } else if(roll > 20 && roll <=40){
        purchaseUpgrades();
    } else {
        console.log("not doing variable task")
    }
}

const checkAndEngageWithLumps = () => {
    const now = Date.now();
    const isRipe = (now-Game.lumpT) >= Game.lumpMatureAge;
    const shouldLumps = Game.canLumps() && isRipe;

    if(shouldLumps){
        Game.clickLump();
    }
}

const checkForShimmersAndClickThem = () => {
    Array.from(document.querySelectorAll(".shimmer")).forEach((cookie) => cookie.click());
}

const acceptAllCookies = () => {
    document.querySelector('.cc_btn.cc_btn_accept_all')?.click();
}

const think = () => {
    try{
        doVariableTasks();
        checkAndEngageWithLumps();
        checkForShimmersAndClickThem();
    }catch(e){
        console.log("failed to think", e);
    }
    const thinkTime = 1000;


    console.log(`Thinking for ${thinkTime}...`)
    activeHandles.push(setTimeout(think, thinkTime));
}
globalThis.ScriptInjector.onInitialize(() => {
    console.log("This is me initializing");
    activeHandles.push(setTimeout(think, 1000));
    setTimeout(() => {
        new Game.shimmer('golden')
    }, 50);
    acceptAllCookies();
    instrumentCookieClicker();
});

globalThis.ScriptInjector.onTearDown(() => {
    console.log("This is me tearing down");
    activeHandles.forEach(handle => {
        clearTimeout(handle);
        clearInterval(handle);
    });
})

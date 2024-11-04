let timeout = null

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
    affordableUpgrades.sort((a, b) => b.basePrice-a.basePrice);
    const [mostExpensiveUpgrade] = affordableUpgrades;
    console.log(`Purchasing the most expensive upgrade to buy: ${mostExpensiveUpgrade.name}`);
    mostExpensiveUpgrade.buy();
}

const purchaseProducts = () => {
    const affordableProducts = getAffordableProducts(Game.cookies);
    affordableProducts.sort((a, b) => b.getPrice()-a.getPrice());
    const [mostExpensiveProduct] = affordableProducts;
    console.log(`Purchasing the most expensive product to buy: ${mostExpensiveProduct.name}`);
    mostExpensiveProduct.buy();
}

const think = () => {
    console.log("Thinking...")
    purchaseUpgrades();
    purchaseProducts();
    setTimeout(think, 5000)
}
globalThis.ScriptInjector.onInitialize(() => {
    console.log("This is me initializing");
    setTimeout(think, 1000);
});

globalThis.ScriptInjector.onTearDown(() => {
    console.log("This is me tearing down");
    clearTimeout(timeout);
})

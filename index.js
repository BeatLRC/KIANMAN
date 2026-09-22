let kians = 0;
let kianlevel = 0;
let kianlevelmulti = 1;

const counter = document.getElementById("counter");
const btn = document.getElementById("kianBtn");
const divider = document.querySelector(".divider");
const leftPanel = document.querySelector(".left");
const kianImg = document.getElementById("kianImg");

//Upgrade buttons
const clickMultiBtn = document.getElementById("upg.clickMulti");
const kianLevelBtn = document.getElementById("upg.kianLevel")

let isDragging = false;

const upgrades = [
    {name: "ClickMultiplier", finite: false, baseCost: 100, clickMulti: 1.3, costMulti: 1.31, currentLevel: 0, type: "multiplier"},
    {name: "KianLevel", finite: false, baseCost: 150, currentLevel: 0, type: "overlay", levels : [
        {id: 1, name: "Silver", cost: 150, multi: 2, image: "../assets/images/kians/SILVER.png"},
        {id: 2, name: "Gold", cost: 750, multi: 2.5, image: "../assets/images/kians/GOLD.png"},
    ]}
]

const BASE_KIAN_IMAGE = "../assets/images/kians/BASE.png";

function applyKianTierVisuals() {
    const kianUpgrade = upgrades[1];
    const ownedTier = kianlevel > 0 ? kianUpgrade.levels[kianlevel - 1] : null;

    btn.classList.remove("tier-silver", "tier-gold");
    if (ownedTier) {
        kianImg.src = ownedTier.image;
        btn.classList.add("tier-" + ownedTier.name.toLowerCase());
    } else {
        kianImg.src = BASE_KIAN_IMAGE;
    }
}

//rounds to 1 decimal place (also cleans up floating point noise like 3.3000000000000003)
//and drops the decimal entirely when it's a whole number, so the multiplier is actually visible
//instead of every gain getting floored down to a flat +1
function formatKians(n) {
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

//works out the cost of the next level of an upgrade based on how many levels have already been bought
function getUpgradeCost(upgrade) {
  // If the upgrade has its own defined stepped levels
  if (upgrade.levels && upgrade.levels[upgrade.currentLevel]) {
    return upgrade.levels[upgrade.currentLevel].cost;
  }
  return upgrade.baseCost * Math.pow(upgrade.costMulti, upgrade.currentLevel);
}

//combines every owned upgrade's effect into a single number added on top of the base 1-per-click
function getClickMultiplier() {
    let multiplier = 1;

    upgrades.forEach((upgrade) => {
        if (upgrade.type == "multiplier") {
            multiplier *= Math.pow(upgrade.clickMulti, upgrade.currentLevel);
        }
    });

    if (kianlevel != 0) {
        multiplier *= upgrades[1].levels?.find(level => level.id === kianlevel).multi
    }

    return multiplier;
}

//keeps the upgrade button's label and enabled/disabled state in sync with the current kian count
function updateUpgradeButtons() {
    const clickMultiUpgrade = upgrades[0];
    const cost = getUpgradeCost(clickMultiUpgrade);

    clickMultiBtn.textContent = `CLICK MULTIPLIER (Lv. ${clickMultiUpgrade.currentLevel}): ${Math.ceil(cost)}`;
    clickMultiBtn.disabled = kians < cost;

    const kianUpgrade = upgrades[1];
    if (kianlevel < kianUpgrade.levels.length) {
        const costKian = getUpgradeCost(kianUpgrade);
        const nextLevelName = kianUpgrade.levels[kianlevel].name;
        kianLevelBtn.textContent = `Kian Level - ${nextLevelName} (Lv. ${kianlevel + 1}): ${Math.ceil(costKian)}`;
        kianLevelBtn.disabled = kians < costKian;
    } else {
        kianLevelBtn.textContent = `Kian Level (MAX)`;
        kianLevelBtn.disabled = true;
    }

    applyKianTierVisuals();
}

//small helper for the "pop a class on, then pop it back off" animation pattern used
//in a few places below - handles the remove/reflow/re-add dance so a rapid repeat
//trigger always restarts the animation instead of doing nothing
function playAnimClass(el, className, duration) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);

    setTimeout(() => {
        el.classList.remove(className);
    }, duration);
}

//spawns a floating "+n" above the kian button that drifts up and fades out,
//so a click's actual reward is visible at a glance instead of only in the counter
function spawnGainPopup(amount) {
    const popup = document.createElement("span");
    popup.className = "gainPopup";
    popup.textContent = "+" + formatKians(amount);

    //a little horizontal jitter so repeated clicks don't stack on the exact same pixel
    const drift = (Math.random() * 40 - 20).toFixed(1);
    popup.style.setProperty("--drift", drift + "px");

    btn.appendChild(popup);
    popup.addEventListener("animationend", () => popup.remove());
}

clickMultiBtn.addEventListener("click", function() {
    const clickMultiUpgrade = upgrades[0];
    const cost = getUpgradeCost(clickMultiUpgrade);

    if (kians < cost) return;

    kians -= cost;
    clickMultiUpgrade.currentLevel++;

    counter.textContent = "Kians: " + formatKians(kians);
    updateUpgradeButtons();
    playAnimClass(clickMultiBtn, "purchased", 500);
});

kianLevelBtn.addEventListener('click', function() {
  const kianUpgrade = upgrades[1];
  if (kianlevel >= kianUpgrade.levels.length) return;
  const cost = getUpgradeCost(kianUpgrade);
  if (kians < cost) return;
  
  kians -= cost;
  kianlevel++;
  kianUpgrade.currentLevel = kianlevel; // sync level tracking
  counter.textContent = 'Kians: ' + formatKians(kians);
  updateUpgradeButtons();
  playAnimClass(kianLevelBtn, 'purchased', 500);
});

//sets the initial button text/state on page load
updateUpgradeButtons();

btn.addEventListener("click", function() {
    //adds 1 * the current click multiplier to the kians counter and then sets the text to update
    const gain = getClickMultiplier();
    kians += gain;
    counter.textContent = "Kians: " + formatKians(kians);
    updateUpgradeButtons();
    playAnimClass(counter, "bump", 180);
    spawnGainPopup(gain);

    //define the rotation for the css animation which i wanted to be random for every click and so i define it in the function to re-randomise
    //every time it is clicked

    const rotation = (Math.random() * 16 - 8) + "deg";

    //set the css 'rotation' var (used in the rotate animation)

    btn.style.setProperty("--rotation", rotation);

    //get the animation started (playAnimClass handles the remove/reflow/re-add so
    //rapid clicks always restart the pop instead of getting stuck)

    playAnimClass(btn, "clicked", 220);
});

document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    const newRightWidth = window.innerWidth - event.clientX;

    if (newRightWidth < 300 || newRightWidth > window.innerWidth - 400) {
        return;
    }

    document.querySelector(".right").style.flex = `0 0 ${newRightWidth}px`;
});

divider.addEventListener("mousedown", () => {
    isDragging = true;
    document.body.style.cursor = "col-resize";
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.cursor = "default";
});
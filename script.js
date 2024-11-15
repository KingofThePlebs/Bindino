// Nastavení canvasu
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Herní data
let workers = [];
let resourceLocations = [];
let village = { x: canvas.width / 2, y: canvas.height / 2, size: 30 };
let villageGrowth = 0;
let freeWorkers = 5;
let maxWorkers = 5;
let resources = {
    wood: 0,
    stone: 0,
    coal: 0,
    iron: 0,
    gold: 0,
    planks: 0,
    stoneChisels: 0,
    ironIngot: 0,
    goldIngot: 0,
    food: 0,
    wool: 0,
    meat: 0
};

// Aktualizovaný seznam budov (odstraněny Tavern, Square, Tools)
let buildings = [];

// Herní čas
let gameTime = 0;

// Přidané proměnné
let enableTrading = false;
let villageGrowthRate = 0;

// Crafting položky (odstraněny Tavern, Square, Tools)
const craftingItems = [
    {
        name: 'Dům',
        requirements: {},
        action: () => {
            maxWorkers++;
            freeWorkers++;
            villageGrowth += 2;
            alert('Postavil jsi dům! Maximální počet workerů se zvýšil.');
        }
    },
    {
        name: 'Vozík',
        requirements: {},
        action: () => {
            workers.forEach(worker => worker.capacity += 1);
            alert('Vyrobil jsi vozík! Workeři unesou více surovin.');
        }
    },
    {
        name: 'Pila (Sawmill)',
        requirements: {},
        action: () => {
            buildBuilding('sawmill');
            villageGrowth += 1;
            alert('Postavil jsi pilu! Můžeš nyní vyrábět prkna.');
            renderBuildingControls();
        }
    },
    {
        name: 'Kamenictví (Stone Workshop)',
        requirements: {},
        action: () => {
            buildBuilding('stoneWorkshop');
            villageGrowth += 1;
            alert('Postavil jsi kamenictví! Můžeš nyní vyrábět kamenické nástroje.');
            renderBuildingControls();
        }
    },
    {
        name: 'Tavírna (Furnace)',
        requirements: {},
        action: () => {
            buildBuilding('furnace');
            villageGrowth += 1;
            alert('Postavil jsi tavírnu! Můžeš nyní tavit ingoty.');
            renderBuildingControls();
        }
    },
    {
        name: 'Farma (Farm)',
        requirements: {},
        action: () => {
            buildBuilding('farm');
            villageGrowth += 1;
            alert('Postavil jsi farmu! Můžeš nyní produkovat jídlo.');
            renderBuildingControls();
        }
    },
    {
        name: 'Kovárna (Blacksmith)',
        requirements: {},
        action: () => {
            buildBuilding('blacksmith');
            villageGrowth += 1;
            alert('Postavil jsi kovárnu! Můžeš nyní vyrábět pokročilé nástroje.');
            renderBuildingControls();
        }
    },
    {
        name: 'Ovčí farma (Sheep Field)',
        requirements: {},
        action: () => {
            buildBuilding('sheepField');
            villageGrowth += 1;
            alert('Postavil jsi ovčí farmu! Můžeš nyní produkovat vlnu.');
            renderBuildingControls();
        }
    },
    {
        name: 'Prasečí farma (Pig Field)',
        requirements: {},
        action: () => {
            buildBuilding('pigField');
            villageGrowth += 1;
            alert('Postavil jsi prasečí farmu! Můžeš nyní produkovat maso.');
            renderBuildingControls();
        }
    },
    {
        name: 'Studna (Well)',
        requirements: {},
        action: () => {
            buildBuilding('well');
            villageGrowth += 1;
            alert('Postavil jsi studnu! Vesnice je zdravější.');
            // Můžeme implementovat bonus později
        }
    },
    {
        name: 'Škola (School)',
        requirements: {},
        action: () => {
            buildBuilding('school');
            villageGrowth += 1;
            alert('Postavil jsi školu! Workeři jsou efektivnější.');
            workers.forEach(worker => worker.capacity += 0.5);
        }
    }
];

// Workers assigned to resource locations
let resourceAssignments = {
    wood: 0,
    stone: 0,
    coal: 0,
    iron: 0,
    gold: 0
};

// Workers assigned to buildings
let buildingAssignments = {
    sawmill: 0,
    stoneWorkshop: 0,
    furnace: 0,
    farm: 0,
    blacksmith: 0,
    sheepField: 0,
    pigField: 0
};

// Maximální počet workerů pro každou budovu
let buildingMaxWorkers = {
    sawmill: 0,
    stoneWorkshop: 0,
    furnace: 0,
    farm: 0,
    blacksmith: 0,
    sheepField: 0,
    pigField: 0
};

// Inicializace hry
function init() {
    // Načtení uložené hry, pokud existuje
    loadGame();

    // Vytvoření lokací surovin, pokud nejsou načteny
    if (resourceLocations.length === 0) {
        resourceLocations.push({ x: canvas.width * 0.25, y: canvas.height * 0.25, type: 'wood', name: 'Les' });
        resourceLocations.push({ x: canvas.width * 0.75, y: canvas.height * 0.25, type: 'stone', name: 'Kamenolom' });
        resourceLocations.push({ x: canvas.width * 0.25, y: canvas.height * 0.75, type: 'coal', name: 'Uhelný důl' });
        resourceLocations.push({ x: canvas.width * 0.75, y: canvas.height * 0.75, type: 'iron', name: 'Železný důl' });
        resourceLocations.push({ x: canvas.width / 2, y: canvas.height * 0.85, type: 'gold', name: 'Zlatý důl' });
    }

    // Vykreslení crafting tabulky
    renderCraftingTable();

    // Vykreslení ovládacích prvků pro suroviny a budovy
    renderResourceControls();
    renderBuildingControls();

    // Hlavní smyčka
    setInterval(gameLoop, 50);

    // Aktualizace herního času každou sekundu
    setInterval(() => {
        gameTime++;
    }, 1000);
}

// Hlavní smyčka hry
function gameLoop() {
    update();
    draw();
}

// Aktualizace stavu hry
function update() {
    // Aktualizace workerů
    workers.forEach(worker => {
        if (worker.state === 'going') {
            moveTowards(worker, worker.target);
            if (distance(worker, worker.target) < 5) {
                worker.state = 'collecting';
                worker.timer = 50; // Čas sběru
            }
        } else if (worker.state === 'collecting') {
            worker.timer--;
            if (worker.timer <= 0) {
                worker.state = 'returning';
                worker.target = { x: village.x, y: village.y };
            }
        } else if (worker.state === 'returning') {
            moveTowards(worker, worker.target);
            if (distance(worker, worker.target) < 5) {
                // Přidání surovin nebo produktů
                if (worker.workerType === 'resource') {
                    resources[worker.resourceType] += worker.capacity;
                } else if (worker.workerType === 'production') {
                    // Přidání produktu podle typu budovy
                    let product = getProductByBuilding(worker.buildingType);
                    if (product) {
                        resources[product] += worker.capacity;
                    }
                }
                // Nastavení cíle zpět na lokaci nebo budovu
                worker.state = 'going';
                if (worker.workerType === 'resource') {
                    worker.target = getLocationByType(worker.resourceType);
                } else if (worker.workerType === 'production') {
                    let building = getBuildingByType(worker.buildingType);
                    if (building) {
                        worker.target = building.position;
                    }
                }
            }
        }
    });

    // Aktualizace růstu vesnice (pokud máme bonusové budovy)
    if (villageGrowthRate > 0) {
        villageGrowth += villageGrowthRate;
    }
}

// Vykreslení hry
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vykreslení vesnice (kosočtverec)
    let villageSize = village.size + villageGrowth;
    ctx.fillStyle = 'brown';
    ctx.beginPath();
    ctx.moveTo(village.x, village.y - villageSize);
    ctx.lineTo(village.x + villageSize, village.y);
    ctx.lineTo(village.x, village.y + villageSize);
    ctx.lineTo(village.x - villageSize, village.y);
    ctx.closePath();
    ctx.fill();

    // Vykreslení lokací surovin (kruh)
    resourceLocations.forEach(location => {
        ctx.fillStyle = getResourceColor(location.type);
        ctx.beginPath();
        ctx.arc(location.x, location.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Zobrazení názvu lokace
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText(location.name, location.x - 30, location.y - 25);
    });

    // Vykreslení budov
    const productionBuildings = ['sawmill', 'stoneWorkshop', 'furnace', 'farm', 'blacksmith', 'sheepField', 'pigField'];
    const nonProductionBuildings = ['well', 'school'];

    // Vykreslení produkčních budov (pouze jedna od každého typu)
    let productionIndex = 0;
    productionBuildings.forEach(type => {
        const count = buildings.filter(b => b.type === type).length;
        if (count > 0) {
            let buildingColor = getBuildingColor(type);
            let angle = (productionIndex / productionBuildings.length) * Math.PI * 2;
            let bx = village.x + (villageSize + 200) * Math.cos(angle);
            let by = village.y + (villageSize + 200) * Math.sin(angle);

            let building = { type: type, position: { x: bx, y: by } };

            ctx.fillStyle = buildingColor;
            ctx.beginPath();
            ctx.moveTo(bx, by - 15);
            ctx.lineTo(bx + 15, by);
            ctx.lineTo(bx, by + 15);
            ctx.lineTo(bx - 15, by);
            ctx.closePath();
            ctx.fill();

            // Zobrazení typu budovy
            ctx.fillStyle = 'black';
            ctx.fillText(`${type}`, bx - 25, by + 35);

            // Aktualizace pozice budovy v seznamu budov
            buildings.forEach(b => {
                if (b.type === type) {
                    b.position = { x: bx, y: by };
                }
            });

            productionIndex++;
        }
    });

    // Vykreslení neprodukčních budov (každá budova)
    let nonProductionIndex = 0;
    buildings.forEach((building, index) => {
        if (nonProductionBuildings.includes(building.type)) {
            let buildingColor = getBuildingColor(building.type);
            let angle = (nonProductionIndex / nonProductionBuildings.length) * Math.PI * 2;
            let bx = village.x + (villageSize + 100) * Math.cos(angle);
            let by = village.y + (villageSize + 100) * Math.sin(angle);

            building.position = { x: bx, y: by };

            ctx.fillStyle = buildingColor;
            ctx.beginPath();
            ctx.moveTo(bx, by - 15);
            ctx.lineTo(bx + 15, by);
            ctx.lineTo(bx, by + 15);
            ctx.lineTo(bx - 15, by);
            ctx.closePath();
            ctx.fill();

            // Zobrazení typu budovy
            ctx.fillStyle = 'black';
            ctx.fillText(`${building.type}`, bx - 25, by + 35);

            nonProductionIndex++;
        }
    });

    // Vykreslení workerů (kruh)
    workers.forEach(worker => {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(worker.x, worker.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Vykreslení informací
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`Volní workeři: ${freeWorkers}/${maxWorkers}`, 10, 20);
    ctx.fillText(`Suroviny: Dřevo ${resources.wood}, Kámen ${resources.stone}, Uhlí ${resources.coal}, Železo ${resources.iron}, Zlato ${resources.gold}`, 10, 40);
    ctx.fillText(`Produkty: Prkna ${resources.planks}, Kamenické nástroje ${resources.stoneChisels}, Železné ingoty ${resources.ironIngot}, Zlaté ingoty ${resources.goldIngot}`, 10, 60);
    ctx.fillText(`Potraviny: Jídlo ${resources.food}, Vlna ${resources.wool}, Maso ${resources.meat}`, 10, 80);
    ctx.fillText(`Herní čas: ${formatGameTime(gameTime)}`, 10, 100);
}

// Pomocné funkce
function moveTowards(obj, target) {
    let dx = target.x - obj.x;
    let dy = target.y - obj.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
        obj.x += (dx / dist) * obj.speed;
        obj.y += (dy / dist) * obj.speed;
    }
}

function distance(obj1, obj2) {
    let dx = obj1.x - obj2.x;
    let dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getLocationByType(type) {
    return resourceLocations.find(location => location.type === type);
}

function getBuildingByType(type) {
    return buildings.find(building => building.type === type);
}

function getResourceColor(type) {
    switch (type) {
        case 'wood':
            return 'green';
        case 'stone':
            return 'gray';
        case 'coal':
            return 'black';
        case 'iron':
            return 'silver';
        case 'gold':
            return 'gold';
        default:
            return 'white';
    }
}

function getBuildingColor(type) {
    switch (type) {
        case 'sawmill':
            return 'saddlebrown';
        case 'stoneWorkshop':
            return 'gray';
        case 'furnace':
            return 'darkred';
        case 'farm':
            return 'green';
        case 'blacksmith':
            return 'silver';
        case 'sheepField':
            return 'lightgray';
        case 'pigField':
            return 'pink';
        case 'well':
            return 'lightblue';
        case 'school':
            return 'purple';
        default:
            return 'brown';
    }
}

function getProductByBuilding(buildingType) {
    switch (buildingType) {
        case 'sawmill':
            if (resources.wood >= 1) {
                resources.wood--; // Spotřeba dřeva
                return 'planks';
            } else {
                return null;
            }
        case 'stoneWorkshop':
            if (resources.stone >= 1) {
                resources.stone--; // Spotřeba kamene
                return 'stoneChisels';
            } else {
                return null;
            }
        case 'furnace':
            if (resources.coal >= 1) {
                if (resources.iron >= 1) {
                    resources.iron--; // Spotřeba železa
                    resources.coal--; // Spotřeba uhlí
                    return 'ironIngot';
                } else if (resources.gold >= 1) {
                    resources.gold--; // Spotřeba zlata
                    resources.coal--; // Spotřeba uhlí
                    return 'goldIngot';
                } else {
                    return null;
                }
            } else {
                return null;
            }
        case 'farm':
            return 'food';
        case 'blacksmith':
            if (resources.ironIngot >= 1) {
                resources.ironIngot--; // Spotřeba železného ingotu
                return 'planks'; // Upraveno, protože nástroje byly odstraněny
            } else {
                return null;
            }
        case 'sheepField':
            return 'wool';
        case 'pigField':
            return 'meat';
        default:
            return null;
    }
}

function formatGameTime(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
}

// Funkce pro crafting
function renderCraftingTable() {
    const craftingBody = document.getElementById('craftingBody');
    craftingBody.innerHTML = '';
    craftingItems.forEach((item, index) => {
        const tr = document.createElement('tr');

        const nameTd = document.createElement('td');
        nameTd.textContent = item.name;
        tr.appendChild(nameTd);

        const reqTd = document.createElement('td');
        if (Object.keys(item.requirements).length === 0) {
            reqTd.textContent = 'Žádné';
        } else {
            reqTd.textContent = Object.entries(item.requirements).map(([res, qty]) => `${res}: ${qty}`).join(', ');
        }
        tr.appendChild(reqTd);

        const actionTd = document.createElement('td');
        const btn = document.createElement('button');
        btn.textContent = 'Craft';
        btn.className = 'craft-button';
        btn.onclick = () => craftItem(index);
        actionTd.appendChild(btn);
        tr.appendChild(actionTd);

        craftingBody.appendChild(tr);
    });
}

function craftItem(index) {
    const item = craftingItems[index];
    let canCraft = true;
    for (let res in item.requirements) {
        if (resources[res] === undefined || resources[res] < item.requirements[res]) {
            canCraft = false;
            break;
        }
    }
    if (canCraft) {
        for (let res in item.requirements) {
            resources[res] -= item.requirements[res];
        }
        item.action();
        // Aktualizace ovládacích prvků budov
        renderBuildingControls();
    } else {
        alert('Nemáš dostatek surovin!');
    }
}

// Funkce pro stavbu budovy
function buildBuilding(type) {
    // Pokud budova již existuje a je produkční, pouze zvýšíme maximální počet workerů
    const productionBuildings = ['sawmill', 'stoneWorkshop', 'furnace', 'farm', 'blacksmith', 'sheepField', 'pigField'];
    if (productionBuildings.includes(type)) {
        buildingMaxWorkers[type] = (buildingMaxWorkers[type] || 0) + 1;
        if (!buildings.find(b => b.type === type)) {
            buildings.push({ type: type });
        }
    } else {
        buildings.push({ type: type });
    }
}

// Funkce pro vykreslení ovládacích prvků pro suroviny
function renderResourceControls() {
    const resourceControlsDiv = document.getElementById('resourceControls');
    resourceControlsDiv.innerHTML = '';
    resourceLocations.forEach(location => {
        const div = document.createElement('div');
        div.className = 'resource-control';

        const label = document.createElement('span');
        label.textContent = `${location.name} (Workeři: ${resourceAssignments[location.type]})`;

        const minusBtn = document.createElement('button');
        minusBtn.className = 'minus-button';
        minusBtn.onclick = () => removeWorkerFromResource(location.type);

        const plusBtn = document.createElement('button');
        plusBtn.className = 'plus-button';
        plusBtn.onclick = () => addWorkerToResource(location.type);

        div.appendChild(label);
        div.appendChild(minusBtn);
        div.appendChild(plusBtn);

        resourceControlsDiv.appendChild(div);
    });
}

// Funkce pro vykreslení ovládacích prvků pro budovy
function renderBuildingControls() {
    const buildingControlsDiv = document.getElementById('buildingControls');
    buildingControlsDiv.innerHTML = '';

    // Seznam unikátních typů budov
    const buildingTypes = [...new Set(buildings.map(b => b.type))];

    buildingTypes.forEach(type => {
        const count = buildings.filter(b => b.type === type).length;
        const div = document.createElement('div');
        div.className = 'building-control';

        const label = document.createElement('span');
        const maxWorkers = buildingMaxWorkers[type] || count;
        label.textContent = `${type} (Budovy: ${count}, Workeři: ${buildingAssignments[type] || 0}/${maxWorkers})`;

        const minusBtn = document.createElement('button');
        minusBtn.className = 'minus-button';
        minusBtn.onclick = () => removeWorkerFromBuilding(type);

        const plusBtn = document.createElement('button');
        plusBtn.className = 'plus-button';
        plusBtn.onclick = () => addWorkerToBuilding(type);

        div.appendChild(label);
        div.appendChild(minusBtn);
        div.appendChild(plusBtn);

        buildingControlsDiv.appendChild(div);
    });
}

// Funkce pro přidání a odebrání workerů z lokací surovin
function addWorkerToResource(resourceType) {
    if (freeWorkers > 0) {
        let worker = {
            x: village.x,
            y: village.y,
            target: getLocationByType(resourceType),
            state: 'going',
            speed: 1.5,
            resourceType: resourceType,
            capacity: 1,
            workerType: 'resource'
        };
        workers.push(worker);
        resourceAssignments[resourceType]++;
        freeWorkers--;
        renderResourceControls();
    } else {
        alert('Nemáš volné workery!');
    }
}

function removeWorkerFromResource(resourceType) {
    if (resourceAssignments[resourceType] > 0) {
        // Najdi workera, který těží danou surovinu
        const workerIndex = workers.findIndex(w => w.resourceType === resourceType && w.workerType === 'resource');
        if (workerIndex !== -1) {
            workers.splice(workerIndex, 1);
            resourceAssignments[resourceType]--;
            freeWorkers++;
            renderResourceControls();
        }
    } else {
        alert('V této lokaci nemáš žádné workery!');
    }
}

// Funkce pro přidání a odebrání workerů z budov
function addWorkerToBuilding(buildingType) {
    const maxWorkers = buildingMaxWorkers[buildingType] || buildings.filter(b => b.type === buildingType).length;
    const assignedWorkers = buildingAssignments[buildingType] || 0;

    if (assignedWorkers < maxWorkers && freeWorkers > 0) {
        let building = getBuildingByType(buildingType);
        if (building) {
            let worker = {
                x: village.x,
                y: village.y,
                target: building.position,
                state: 'going',
                speed: 1.5,
                buildingType: buildingType,
                capacity: 1,
                workerType: 'production'
            };
            workers.push(worker);
            buildingAssignments[buildingType] = assignedWorkers + 1;
            freeWorkers--;
            renderBuildingControls();
        } else {
            alert('Budova nenalezena!');
        }
    } else {
        alert('Nemůžeš přidat více workerů do této budovy!');
    }
}

function removeWorkerFromBuilding(buildingType) {
    const assignedWorkers = buildingAssignments[buildingType] || 0;

    if (assignedWorkers > 0) {
        // Najdi workera, který pracuje v dané budově
        const workerIndex = workers.findIndex(w => w.buildingType === buildingType && w.workerType === 'production');
        if (workerIndex !== -1) {
            workers.splice(workerIndex, 1);
            buildingAssignments[buildingType] = assignedWorkers - 1;
            freeWorkers++;
            renderBuildingControls();
        }
    } else {
        alert('V této budově nemáš žádné workery!');
    }
}

// Funkce pro vykreslení ovládacích prvků pro obchodování
function renderTradingControls() {
    if (!enableTrading) return;
    // Implementace obchodování může být přidána zde
    // Například přidání tlačítek pro prodej surovin za zlato
}

// Funkce pro ukládání hry
function saveGame() {
    const gameData = {
        workers,
        freeWorkers,
        maxWorkers,
        resources,
        buildings,
        gameTime,
        resourceAssignments,
        buildingAssignments,
        buildingMaxWorkers,
        villageGrowth,
        enableTrading,
        villageGrowthRate
    };
    localStorage.setItem('villageIdleSave', JSON.stringify(gameData));
    alert('Hra byla uložena!');
}

// Funkce pro načtení hry
function loadGame() {
    const savedData = localStorage.getItem('villageIdleSave');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        workers = gameData.workers.map(worker => ({ ...worker }));
        freeWorkers = gameData.freeWorkers;
        maxWorkers = gameData.maxWorkers;
        resources = { ...gameData.resources };
        buildings = gameData.buildings.map(building => ({ ...building }));
        gameTime = gameData.gameTime || 0;
        resourceAssignments = { ...gameData.resourceAssignments };
        buildingAssignments = { ...gameData.buildingAssignments };
        buildingMaxWorkers = { ...gameData.buildingMaxWorkers };
        villageGrowth = gameData.villageGrowth || 0;
        enableTrading = gameData.enableTrading || false;
        villageGrowthRate = gameData.villageGrowthRate || 0;

        // Pokud je povoleno obchodování, znovu vykresli ovládací prvky
        if (enableTrading) {
            renderTradingControls();
        }
    }
}

// Funkce pro resetování hry
function resetGame() {
    if (confirm('Opravdu chceš resetovat hru?')) {
        localStorage.removeItem('villageIdleSave');
        location.reload();
    }
}

// Přidání event listenerů na tlačítka
document.getElementById('saveButton').addEventListener('click', saveGame);
document.getElementById('resetButton').addEventListener('click', resetGame);

// Inicializace hry
init();

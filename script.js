// Nastavení canvasu
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Herní data
let workers = [];
let resourceLocations = [];
let village = { x: 400, y: 300, size: 30 };
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
    meat: 0,
    tools: 0
};

// Nové budovy
let buildings = [];

// Herní čas
let gameTime = 0;

// Přidané proměnné
let enableTrading = false;
let villageGrowthRate = 0;

// Crafting položky
const craftingItems = [
    {
        name: 'Dům',
        requirements: { planks: 20, stoneChisels: 10 },
        action: () => {
            maxWorkers++;
            freeWorkers++;
            villageGrowth += 2;
            alert('Postavil jsi dům! Maximální počet workerů se zvýšil.');
        }
    },
    {
        name: 'Nástroj',
        requirements: { ironIngot: 5 },
        action: () => {
            workers.forEach(worker => worker.speed += 0.5);
            alert('Vyrobil jsi nástroj! Workeři pracují rychleji.');
        }
    },
    {
        name: 'Vozík',
        requirements: { planks: 10, ironIngot: 5 },
        action: () => {
            workers.forEach(worker => worker.capacity += 1);
            alert('Vyrobil jsi vozík! Workeři unesou více surovin.');
        }
    },
    {
        name: 'Pila (Sawmill)',
        requirements: { wood: 50, stone: 30 },
        action: () => {
            buildBuilding('sawmill');
            villageGrowth += 1;
            alert('Postavil jsi pilu! Můžeš nyní vyrábět prkna.');
        }
    },
    {
        name: 'Kamenictví (Stone Workshop)',
        requirements: { wood: 40, stone: 40 },
        action: () => {
            buildBuilding('stoneWorkshop');
            villageGrowth += 1;
            alert('Postavil jsi kamenictví! Můžeš nyní vyrábět kamenické nástroje.');
        }
    },
    {
        name: 'Tavírna (Furnace)',
        requirements: { stone: 60, iron: 20 },
        action: () => {
            buildBuilding('furnace');
            villageGrowth += 1;
            alert('Postavil jsi tavírnu! Můžeš nyní tavit ingoty.');
        }
    },
    {
        name: 'Farma (Farm)',
        requirements: { planks: 30, stoneChisels: 20 },
        action: () => {
            buildBuilding('farm');
            villageGrowth += 1;
            alert('Postavil jsi farmu! Můžeš nyní produkovat jídlo.');
        }
    },
    {
        name: 'Kovárna (Blacksmith)',
        requirements: { ironIngot: 40, stoneChisels: 20 },
        action: () => {
            buildBuilding('blacksmith');
            villageGrowth += 1;
            alert('Postavil jsi kovárnu! Můžeš nyní vyrábět pokročilé nástroje.');
        }
    },
    {
        name: 'Ovčí farma (Sheep Field)',
        requirements: { planks: 20, stoneChisels: 10 },
        action: () => {
            buildBuilding('sheepField');
            villageGrowth += 1;
            alert('Postavil jsi ovčí farmu! Můžeš nyní produkovat vlnu.');
        }
    },
    {
        name: 'Prasečí farma (Pig Field)',
        requirements: { planks: 20, stoneChisels: 10 },
        action: () => {
            buildBuilding('pigField');
            villageGrowth += 1;
            alert('Postavil jsi prasečí farmu! Můžeš nyní produkovat maso.');
        }
    },
    {
        name: 'Taverna (Tavern)',
        requirements: { planks: 50, stoneChisels: 30 },
        action: () => {
            buildBuilding('tavern');
            villageGrowth += 1;
            alert('Postavil jsi tavernu! Workeři jsou šťastnější a pracují efektivněji.');
            workers.forEach(worker => worker.speed += 0.2);
        }
    },
    {
        name: 'Tržiště (Market)',
        requirements: { planks: 60, stoneChisels: 40, goldIngot: 10 },
        action: () => {
            buildBuilding('market');
            villageGrowth += 1;
            alert('Postavil jsi tržiště! Můžeš nyní obchodovat suroviny za zlato.');
            enableTrading = true;
            renderTradingControls();
        }
    },
    {
        name: 'Náměstí (Square)',
        requirements: { stoneChisels: 50 },
        action: () => {
            buildBuilding('square');
            villageGrowth += 2;
            alert('Postavil jsi náměstí! Vesnice je atraktivnější a rychleji roste.');
            villageGrowthRate += 0.1;
        }
    },
    {
        name: 'Studna (Well)',
        requirements: { stoneChisels: 30 },
        action: () => {
            buildBuilding('well');
            villageGrowth += 1;
            alert('Postavil jsi studnu! Vesnice je zdravější.');
            // Můžeme implementovat bonus později
        }
    },
    {
        name: 'Škola (School)',
        requirements: { planks: 80, stoneChisels: 50 },
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

// Inicializace hry
function init() {
    // Načtení uložené hry, pokud existuje
    loadGame();

    // Vytvoření lokací surovin, pokud nejsou načteny
    if (resourceLocations.length === 0) {
        resourceLocations.push({ x: 100, y: 100, type: 'wood' });
        resourceLocations.push({ x: 700, y: 100, type: 'stone' });
        resourceLocations.push({ x: 100, y: 500, type: 'coal' });
        resourceLocations.push({ x: 700, y: 500, type: 'iron' });
        resourceLocations.push({ x: 400, y: 550, type: 'gold' });
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
                // Přidání surovin
                resources[worker.resourceType] += worker.capacity;
                worker.state = 'going';
                worker.target = getLocationByType(worker.resourceType);
            }
        }
    });

    // Produkce v budovách
    buildings.forEach(building => {
        const buildingType = building.type;
        const assignedWorkers = buildingAssignments[buildingType] || 0;
        if (assignedWorkers > 0) {
            switch (buildingType) {
                case 'sawmill':
                    if (resources.wood >= assignedWorkers) {
                        resources.wood -= assignedWorkers;
                        resources.planks += assignedWorkers;
                    }
                    break;
                case 'stoneWorkshop':
                    if (resources.stone >= assignedWorkers) {
                        resources.stone -= assignedWorkers;
                        resources.stoneChisels += assignedWorkers;
                    }
                    break;
                case 'furnace':
                    if (resources.coal >= assignedWorkers) {
                        if (resources.iron >= assignedWorkers) {
                            resources.iron -= assignedWorkers;
                            resources.coal -= assignedWorkers;
                            resources.ironIngot += assignedWorkers;
                        } else if (resources.gold >= assignedWorkers) {
                            resources.gold -= assignedWorkers;
                            resources.coal -= assignedWorkers;
                            resources.goldIngot += assignedWorkers;
                        }
                    }
                    break;
                case 'farm':
                    resources.food += assignedWorkers;
                    break;
                case 'blacksmith':
                    if (resources.ironIngot >= assignedWorkers) {
                        resources.ironIngot -= assignedWorkers;
                        resources.tools += assignedWorkers;
                    }
                    break;
                case 'sheepField':
                    resources.wool += assignedWorkers;
                    break;
                case 'pigField':
                    resources.meat += assignedWorkers;
                    break;
                // Budovy s bonusy jsou řešeny v akcích při stavbě
                default:
                    break;
            }
        }
    });

    // Aktualizace růstu vesnice (pokud máme náměstí)
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
    ctx.fillText(`Potraviny: Jídlo ${resources.food}, Vlna ${resources.wool}, Maso ${resources.meat}, Nástroje ${resources.tools}`, 10, 80);
    ctx.fillText(`Herní čas: ${formatGameTime(gameTime)}`, 10, 100);

    // Vykreslení budov
    buildings.forEach((building, index) => {
        let buildingColor;
        switch (building.type) {
            case 'sawmill':
                buildingColor = 'saddlebrown';
                break;
            case 'stoneWorkshop':
                buildingColor = 'gray';
                break;
            case 'furnace':
                buildingColor = 'darkred';
                break;
            case 'farm':
                buildingColor = 'green';
                break;
            case 'blacksmith':
                buildingColor = 'silver';
                break;
            case 'sheepField':
                buildingColor = 'lightgray';
                break;
            case 'pigField':
                buildingColor = 'pink';
                break;
            case 'tavern':
                buildingColor = 'orange';
                break;
            case 'market':
                buildingColor = 'gold';
                break;
            case 'square':
                buildingColor = 'blue';
                break;
            case 'well':
                buildingColor = 'lightblue';
                break;
            case 'school':
                buildingColor = 'purple';
                break;
            default:
                buildingColor = 'brown';
        }

        let angle = (index / buildings.length) * Math.PI * 2;
        let bx = village.x + (villageSize + 30) * Math.cos(angle);
        let by = village.y + (villageSize + 30) * Math.sin(angle);

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
    });
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
        reqTd.textContent = Object.entries(item.requirements).map(([res, qty]) => `${res}: ${qty}`).join(', ');
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
    buildings.push({ type: type });
}

// Funkce pro vykreslení ovládacích prvků pro suroviny
function renderResourceControls() {
    const resourceControlsDiv = document.getElementById('resourceControls');
    resourceControlsDiv.innerHTML = '';
    resourceLocations.forEach(location => {
        const div = document.createElement('div');
        div.className = 'resource-control';

        const label = document.createElement('span');
        label.textContent = `${location.type} (Workeři: ${resourceAssignments[location.type]})`;

        const minusBtn = document.createElement('button');
        minusBtn.textContent = '-';
        minusBtn.onclick = () => removeWorkerFromResource(location.type);

        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
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
        label.textContent = `${type} (Budovy: ${count}, Workeři: ${buildingAssignments[type] || 0})`;

        const minusBtn = document.createElement('button');
        minusBtn.textContent = '-';
        minusBtn.onclick = () => removeWorkerFromBuilding(type);

        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
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
            capacity: 1
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
        const workerIndex = workers.findIndex(w => w.resourceType === resourceType && w.state !== 'removing');
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
    const buildingCount = buildings.filter(b => b.type === buildingType).length;
    const assignedWorkers = buildingAssignments[buildingType] || 0;

    if (assignedWorkers < buildingCount && freeWorkers > 0) {
        buildingAssignments[buildingType] = assignedWorkers + 1;
        freeWorkers--;
        renderBuildingControls();
    } else {
        alert('Nemůžeš přidat více workerů do této budovy!');
    }
}

function removeWorkerFromBuilding(buildingType) {
    const assignedWorkers = buildingAssignments[buildingType] || 0;

    if (assignedWorkers > 0) {
        buildingAssignments[buildingType] = assignedWorkers - 1;
        freeWorkers++;
        renderBuildingControls();
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
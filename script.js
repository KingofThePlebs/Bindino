// Nastavení canvasu
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Herní data
let workers = [];
let resourceLocations = [];
let village = { x: 400, y: 300 };
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
    goldIngot: 0
};

// Nové budovy
let buildings = [];

// Herní čas
let gameTime = 0; // v sekundách

// Crafting položky
const craftingItems = [
    {
        name: 'Dům',
        requirements: { planks: 20, stoneChisels: 10 },
        action: () => {
            maxWorkers++;
            freeWorkers++;
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
            alert('Postavil jsi pilu! Můžeš nyní vyrábět prkna.');
        }
    },
    {
        name: 'Kamenictví (Stone Workshop)',
        requirements: { wood: 40, stone: 40 },
        action: () => {
            buildBuilding('stoneWorkshop');
            alert('Postavil jsi kamenictví! Můžeš nyní vyrábět kamenické nástroje.');
        }
    },
    {
        name: 'Tavírna (Furnace)',
        requirements: { stone: 60, iron: 20 },
        action: () => {
            buildBuilding('furnace');
            alert('Postavil jsi tavírnu! Můžeš nyní tavit ingoty.');
        }
    }
];

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
        if (building.workers > 0) {
            if (building.type === 'sawmill') {
                if (resources.wood >= building.workers) {
                    resources.wood -= building.workers;
                    resources.planks += building.workers;
                }
            } else if (building.type === 'stoneWorkshop') {
                if (resources.stone >= building.workers) {
                    resources.stone -= building.workers;
                    resources.stoneChisels += building.workers;
                }
            } else if (building.type === 'furnace') {
                if (resources.coal >= building.workers) {
                    if (resources.iron >= building.workers) {
                        resources.iron -= building.workers;
                        resources.coal -= building.workers;
                        resources.ironIngot += building.workers;
                    } else if (resources.gold >= building.workers) {
                        resources.gold -= building.workers;
                        resources.coal -= building.workers;
                        resources.goldIngot += building.workers;
                    }
                }
            }
        }
    });
}

// Vykreslení hry
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vykreslení vesnice (kosočtverec)
    ctx.fillStyle = 'brown';
    ctx.beginPath();
    ctx.moveTo(village.x, village.y - 20);
    ctx.lineTo(village.x + 20, village.y);
    ctx.lineTo(village.x, village.y + 20);
    ctx.lineTo(village.x - 20, village.y);
    ctx.closePath();
    ctx.fill();

    // Vykreslení lokací surovin (čtverec)
    resourceLocations.forEach(location => {
        ctx.fillStyle = getResourceColor(location.type);
        ctx.fillRect(location.x - 15, location.y - 15, 30, 30);
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
    ctx.fillText(`Herní čas: ${formatGameTime(gameTime)}`, 10, 80);

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
            default:
                buildingColor = 'brown';
        }

        let bx = village.x + (index + 1) * 60;
        let by = village.y;

        ctx.fillStyle = buildingColor;
        ctx.beginPath();
        ctx.moveTo(bx, by - 15);
        ctx.lineTo(bx + 15, by);
        ctx.lineTo(bx, by + 15);
        ctx.lineTo(bx - 15, by);
        ctx.closePath();
        ctx.fill();

        // Zobrazení počtu workerů v budově
        ctx.fillStyle = 'black';
        ctx.fillText(`Workeři: ${building.workers}`, bx - 25, by + 35);
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
    } else {
        alert('Nemáš dostatek surovin!');
    }
}

// Funkce pro stavbu budovy
function buildBuilding(type) {
    buildings.push({ type: type, workers: 0 });
}

// Přidělení workerů do budov
function assignWorkerToBuilding(buildingType) {
    const building = buildings.find(b => b.type === buildingType);
    if (building && freeWorkers > 0) {
        building.workers++;
        freeWorkers--;
    } else {
        alert('Nemáš volné workery nebo budova neexistuje!');
    }
}

// Přidání event listenerů
canvas.addEventListener('click', function(event) {
    let rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    // Přidělení workerů do lokací surovin
    resourceLocations.forEach(location => {
        if (mouseX >= location.x - 15 && mouseX <= location.x + 15 && mouseY >= location.y - 15 && mouseY <= location.y + 15) {
            if (freeWorkers > 0) {
                let worker = {
                    x: village.x,
                    y: village.y,
                    target: { x: location.x, y: location.y },
                    state: 'going',
                    speed: 1.5,
                    resourceType: location.type,
                    capacity: 1
                };
                workers.push(worker);
                freeWorkers--;
            } else {
                alert('Nemáš volné workery!');
            }
        }
    });

    // Přidělení workerů do budov
    buildings.forEach((building, index) => {
        let bx = village.x + (index + 1) * 60;
        let by = village.y;
        if (mouseX >= bx - 15 && mouseX <= bx + 15 && mouseY >= by - 15 && mouseY <= by + 15) {
            assignWorkerToBuilding(building.type);
        }
    });
});

// Funkce pro ukládání hry
function saveGame() {
    const gameData = {
        workers,
        freeWorkers,
        maxWorkers,
        resources,
        buildings,
        gameTime
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
    }
}

// Přidání event listeneru na tlačítko Uložit hru
document.getElementById('saveButton').addEventListener('click', saveGame);

// Inicializace hry
init();
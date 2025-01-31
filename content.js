(function injectUI() {
    // Create main container
    const container = document.createElement("div");
    container.id = "trading-container";
    container.style = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #1e1e2f;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #ffffff;
        width: 360px;
        min-width: 320px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    `;

    container.innerHTML = `
        <div class="draggable-header" style="cursor: move; padding: 12px 16px; margin: -16px -16px 16px -16px; border-radius: 12px 12px 0 0; background: rgba(255, 255, 255, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="color: #d4bfff; font-size: 1.3em; font-weight: bold; margin: 0;">Paper TrAider</h3>
                <div style="background: rgba(255, 255, 255, 0.1); padding: 6px 12px; border-radius: 6px;">
                    <span id="fake-balance" style="color: #38ff8c; font-size: 1em; font-weight: bold;">0.00</span> SOL
                </div>
            </div>
        </div>

        <div class="button-section" style="margin-bottom: 16px;">
            <div class="section-label" style="font-size: 0.9em; color: #b3b3d1; margin-bottom: 8px;">Buy (SOL)</div>
            <div class="button-grid">
                <button class="trade-btn buy" data-amount="0.5">0.5</button>
                <button class="trade-btn buy" data-amount="1">1</button>
                <button class="trade-btn buy" data-amount="2">2</button>
                <button class="trade-btn buy" id="buy-custom">X</button>
            </div>
        </div>

        <div class="button-section" style="margin-bottom: 16px;">
            <div class="section-label" style="font-size: 0.9em; color: #b3b3d1; margin-bottom: 8px;">Sell (%)</div>
            <div class="button-grid">
                <button class="trade-btn sell" data-percent="25">25</button>
                <button class="trade-btn sell" data-percent="50">50</button>
                <button class="trade-btn sell" data-percent="100">100</button>
                <button class="trade-btn sell" id="sell-custom">X</button>
            </div>
        </div>

        <div class="action-section" style="margin-bottom: 16px;">
            <button class="action-btn" id="add-balance">Add Funds</button>
        </div>

        <div class="stats-section" style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #b3b3d1; font-size: 0.9em;">Market Cap</span>
                <span id="current-market-cap" style="color: #ffffff; font-size: 0.9em;">-</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #b3b3d1; font-size: 0.9em;">Total PNL</span>
                <span id="current-pnl" style="color: #38ff8c; font-size: 0.9em;">0.00%</span>
            </div>
        </div>

        <div class="trades-section" style="margin-bottom: 16px;">
            <div class="section-label" style="font-size: 0.9em; color: #b3b3d1; margin-bottom: 8px;">Open Positions</div>
            <div id="positions-container" style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px;">No open positions</div>
        </div>

        <div class="trades-section">
            <div class="section-label" style="font-size: 0.9em; color: #b3b3d1; margin-bottom: 8px;">Recent Trades</div>
            <div id="closed-positions-list" style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; max-height: 150px; overflow-y: auto;">No recent trades</div>
        </div>

        <!-- Resize Handle -->
        <div class="resize-handle" style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; cursor: se-resize; border-right: 2px solid #666; border-bottom: 2px solid #666;"></div>
    `;

    document.body.appendChild(container);

    const style = document.createElement("style");
    style.innerHTML = `
        .button-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
        }

        .trade-btn {
            background: #3b3050;
            border: 1px solid #6c5480;
            color: #ffffff;
            font-size: 0.85em;
            font-weight: 500;
            border-radius: 6px;
            padding: 8px 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 32px;
        }

        .trade-btn.buy {
            background: linear-gradient(135deg, #4a3b6b, #382a55);
            border-color: #5d4a7a;
        }

        .trade-btn.sell {
            background: linear-gradient(135deg, #6b3b4a, #552a38);
            border-color: #7a4a5d;
        }

        .trade-btn:hover {
            filter: brightness(1.2);
        }

        .action-btn {
            background: #4a3b6b;
            border: 1px solid #5d4a7a;
            color: #ffffff;
            font-size: 0.9em;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        }

        .action-btn:hover {
            background: #5d4a7a;
        }

        .section-label {
            font-weight: 500;
            letter-spacing: 0.5px;
        }
    `;
    document.head.appendChild(style);

    // Trading Logic
    let positions = [];
    let closedPositions = [];
    let fakeBalance = parseFloat(localStorage.getItem("fakeBalance")) || 5.0;
    let currentMarketCap = null;

    function saveBalance() {
        localStorage.setItem("fakeBalance", fakeBalance.toFixed(2));
    }

    function updateBalance() {
        const balanceElement = document.getElementById("fake-balance");
        balanceElement.textContent = fakeBalance.toFixed(2);
        balanceElement.style.color = "#38ff8c";
    }

    function getMarketCap() {
        const elements = document.querySelectorAll('.flex.flex-col.items-start .font-medium.text-grey-50');
        if (!elements || elements.length < 3) return null;
        const text = elements[2].textContent;
        const match = text.match(/(\d+[\d,.]*)\s*([A-Za-z]*)/);
        if (match) {
            const numericValue = parseFloat(match[1].replace(/,/g, ''));
            const suffix = match[2].toUpperCase();
            const multipliers = { 'B': 1e9, 'M': 1e6, 'K': 1e3 };
            return numericValue * (multipliers[suffix] || 1);
        }
        return null;
    }

    function getCoinName() {
        const coinElement = document.querySelector('span.font-normal.text-grey-50.block.text-sm.\\!leading-\\[16px\\]');
        return coinElement ? coinElement.textContent.trim() : 'Unknown';
    }

    function buyTrade(amount) {
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount!");
            return;
        }

        currentMarketCap = getMarketCap();
        if (!currentMarketCap) return alert("Market data unavailable!");
        if (fakeBalance < amount) return alert("Insufficient balance!");

        fakeBalance -= amount;
        positions.push({
            amount,
            entryMarketCap: currentMarketCap,
            pnl: 0,
            pnlPercent: 0
        });
        saveBalance();
        updateUI();
    }

    function sellTrade(percentage) {
        if (isNaN(percentage) || percentage <= 0) {
            alert("Invalid percentage!");
            return;
        }

        if (positions.length === 0) return alert("No positions to sell!");

        const totalAmount = positions.reduce((sum, pos) => sum + pos.amount, 0);
        let remaining = (totalAmount * percentage) / 100;
        let totalProfit = 0;

        while (remaining > 0 && positions.length > 0) {
            const position = positions[0];
            const exitPrice = getMarketCap();

            if (position.amount <= remaining) {
                const pnl = ((exitPrice - position.entryMarketCap) / position.entryMarketCap) * position.amount;
                closedPositions.push({
                    amount: position.amount,
                    pnlSOL: pnl,
                    pnlPercent: (pnl / position.amount) * 100,
                    entry: position.entryMarketCap,
                    exit: exitPrice,
                    coin: getCoinName()
                });
                totalProfit += pnl;
                remaining -= position.amount;
                positions.shift();
            } else {
                const pnl = ((exitPrice - position.entryMarketCap) / position.entryMarketCap) * remaining;
                closedPositions.push({
                    amount: remaining,
                    pnlSOL: pnl,
                    pnlPercent: (pnl / remaining) * 100,
                    entry: position.entryMarketCap,
                    exit: exitPrice,
                    coin: getCoinName()
                });
                totalProfit += pnl;
                position.amount -= remaining;
                remaining = 0;
            }
        }

        fakeBalance += (totalAmount * percentage / 100) + totalProfit;
        saveBalance();
        updateUI();
    }

    function updateUI() {
        updateBalance();
        updatePositions();
        updateClosedTrades();
        updatePNL();
        updateMarketCapDisplay();
    }

    function updatePositions() {
        const container = document.getElementById("positions-container");
        currentMarketCap = getMarketCap();

        container.innerHTML = positions.map(pos => {
            const pnl = (currentMarketCap - pos.entryMarketCap) / pos.entryMarketCap * pos.amount;
            const pnlPercent = (pnl / pos.amount) * 100;

            return `
                <div class="position-item">
                    <div>
                        <div style="color: #00ff88; font-weight: 600;">${pos.amount.toFixed(2)} SOL</div>
                        <div class="position-pnl ${pnl >= 0 ? 'profit' : 'loss'}">
                            ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SOL (${pnlPercent.toFixed(2)}%)
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #888; font-size: 0.9em;">Entry: $${pos.entryMarketCap.toLocaleString()}</div>
                        <div style="color: #888; font-size: 0.9em;">Current: $${currentMarketCap.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }).join('') || '<div style="text-align: center; color: #666; padding: 10px;">No open positions</div>';
    }

    function updateClosedTrades() {
        const container = document.getElementById("closed-positions-list");
        container.innerHTML = closedPositions.slice(-5).reverse().map(trade => `
            <div class="trade-pnl ${trade.pnlSOL >= 0 ? 'profit' : 'loss'}">
                <div>
                    <div>${trade.coin}</div>
                    <div>${trade.amount.toFixed(2)} SOL</div>
                </div>
                <div style="text-align: right;">
                    <div>${trade.pnlSOL >= 0 ? '+' : ''}${trade.pnlSOL.toFixed(2)} SOL</div>
                    <div>(${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%)</div>
                </div>
            </div>
        `).join('');
    }

    function updatePNL() {
        const pnlElement = document.getElementById("current-pnl");
        const totalPNL = positions.reduce((sum, pos) => {
            return sum + ((currentMarketCap - pos.entryMarketCap) / pos.entryMarketCap * pos.amount);
        }, 0);
        const totalPercent = (totalPNL / fakeBalance) * 100;

        pnlElement.textContent = `${totalPercent.toFixed(2)}%`;
        pnlElement.style.color = totalPNL >= 0 ? "#00ff88" : "#ff4444";
    }

    function updateMarketCapDisplay() {
        const marketCapElement = document.getElementById("current-market-cap");
        const marketCap = getMarketCap();
        marketCapElement.textContent = marketCap ? `$${marketCap.toLocaleString()}` : '-';
    }

    // Draggable Logic
    let isDragging = false;
    let offset = [0, 0];
    const header = container.querySelector('.draggable-header');

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = container.getBoundingClientRect();
        offset = [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
        container.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const newX = e.clientX - offset[0];
        const newY = e.clientY - offset[1];

        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        const constrainedX = Math.max(0, Math.min(newX, viewportWidth - containerWidth));
        const constrainedY = Math.max(0, Math.min(newY, viewportHeight - containerHeight));

        container.style.left = `${constrainedX}px`;
        container.style.top = `${constrainedY}px`;
        container.style.right = 'unset';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'default';
    });

    // Resizable Logic
    let isResizing = false;
    const resizeHandle = container.querySelector('.resize-handle');

    resizeHandle.addEventListener('mousedown', initResize);

    function initResize(e) {
        isResizing = true;
        const startWidth = container.offsetWidth;
        const startHeight = container.offsetHeight;
        const startX = e.clientX;
        const startY = e.clientY;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);

        function resize(e) {
            if (!isResizing) return;
            container.style.width = `${Math.max(startWidth + (e.clientX - startX), 300)}px`;
            container.style.height = `${Math.max(startHeight + (e.clientY - startY), 200)}px`;
        }

        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    // Event Listeners
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        try {
            if (btn.classList.contains('buy')) {
                if (btn.id === 'buy-custom') {
                    const amount = parseFloat(prompt("Enter custom buy amount (SOL):"));
                    buyTrade(amount);
                } else {
                    const amount = parseFloat(btn.dataset.amount);
                    buyTrade(amount);
                }
            }

            if (btn.classList.contains('sell')) {
                if (btn.id === 'sell-custom') {
                    const percent = parseFloat(prompt("Enter custom sell percentage:"));
                    sellTrade(percent);
                } else {
                    const percent = parseFloat(btn.dataset.percent);
                    sellTrade(percent);
                }
            }

            if (btn.id === 'add-balance') {
                const amount = parseFloat(prompt("Enter SOL amount to add:"));
                if (amount > 0) {
                    fakeBalance += amount;
                    saveBalance();
                    updateUI();
                }
            }
        } catch (error) {
            console.error("Trade error:", error);
            alert("Error processing trade!");
        }
    });

    // Initialize
    setInterval(() => {
        currentMarketCap = getMarketCap();
        if (positions.length > 0) updateUI();
        updateMarketCapDisplay();
    }, 100);
    updateUI();
})();
document.addEventListener('DOMContentLoaded', function() {
    const state = {
        isRevealing: false,
        balance: 1000,
        jackpot: 100000,
        selectedColors: [],
        gameHistory: [],
        gameCount: 0,
        houseProfitTotal: 0,
        jackpotContribution: 0,
        qualifiedForJackpot: false,
        lastGameTime: null,
        colors: [
            { name: 'Vermelho', hex: '#FF0000' },
            { name: 'Verde', hex: '#00FF00' },
            { name: 'Azul', hex: '#0000FF' },
            { name: 'Amarelo', hex: '#FFFF00' },
            { name: 'Roxo', hex: '#800080' },
            { name: 'Laranja', hex: '#FFA500' },
            { name: 'Rosa', hex: '#FF1493' },
            { name: 'Turquesa', hex: '#40E0D0' },
            { name: 'Marrom', hex: '#8B4513' },
            { name: 'Cinza', hex: '#808080' },
            { name: 'Verde Lima', hex: '#006400' },
            { name: 'Índigo', hex: '#4B0082' }
        ]
    };

    const balanceEl = document.getElementById('balanceValue');
    const jackpotEl = document.getElementById('jackpotValue');
    const colorSelectionEl = document.querySelector('.color-selection');
    const betAmountEl = document.getElementById('betAmount');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultMessage = document.getElementById('resultMessage');
    const historyList = document.getElementById('historyList');
    const rulesBtn = document.getElementById('rulesBtn');
    const rulesModal = document.getElementById('rulesModal');
    const closeModal = document.querySelector('.close');

    // Função para tocar sons
    function playSound(type) {
        const sounds = {
            win: new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'),
            lose: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
            click: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
            reveal: new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3')
        };
        
        if (sounds[type]) {
            sounds[type].play().catch(e => console.log('Erro ao tocar som:', e));
        }
    }

    // Funções de armazenamento local
    function saveGameState() {
        const gameState = {
            balance: state.balance,
            jackpot: state.jackpot,
            gameHistory: state.gameHistory,
            gameCount: state.gameCount,
            houseProfitTotal: state.houseProfitTotal,
            jackpotContribution: state.jackpotContribution,
            qualifiedForJackpot: state.qualifiedForJackpot,
            lastGameTime: state.lastGameTime
        };
        
        localStorage.setItem('colorLotteryState', JSON.stringify(gameState));
    }

    function loadGameState() {
        const savedState = localStorage.getItem('colorLotteryState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            state.balance = gameState.balance;
            state.jackpot = gameState.jackpot;
            state.gameHistory = gameState.gameHistory;
            state.gameCount = gameState.gameCount;
            state.houseProfitTotal = gameState.houseProfitTotal;
            state.jackpotContribution = gameState.jackpotContribution;
            state.qualifiedForJackpot = gameState.qualifiedForJackpot;
            state.lastGameTime = gameState.lastGameTime ? new Date(gameState.lastGameTime) : null;
            
            updateBalance();
            updateJackpot();
            updateHistoryDisplay();
        }
    }

    function initGame() {
        loadGameState();
        generateColorOptions();
        updateBalance();
        updateJackpot();

        playBtn.addEventListener('click', playGame);
        resetBtn.addEventListener('click', resetSelection);

        rulesBtn.addEventListener('click', () => {
            rulesModal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            rulesModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === rulesModal) {
                rulesModal.style.display = 'none';
            }
        });
    }

    function generateColorOptions() {
        colorSelectionEl.innerHTML = '<h2>Escolha 6 cores (pode repetir até 6 vezes cada):</h2>';

        state.colors.forEach((color, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-option';
            colorDiv.style.backgroundColor = color.hex;
            colorDiv.dataset.index = index;
            colorDiv.dataset.color = color.name;
            colorDiv.title = color.name;

            const counter = document.createElement('span');
            counter.className = 'selection-count';
            counter.style.display = 'none';
            colorDiv.appendChild(counter);

            colorDiv.addEventListener('click', toggleColorSelection);

            colorSelectionEl.appendChild(colorDiv);
        });
    }

    function toggleColorSelection(e) {
        if (state.isRevealing) return;

        const colorDiv = e.target.closest('.color-option');
        if (!colorDiv) return;

        playSound('click');

        const colorIndex = parseInt(colorDiv.dataset.index);
        const currentCount = state.selectedColors.filter(c => c === colorIndex).length;

        if (state.selectedColors.length < 6 && currentCount < 6) {
            state.selectedColors.push(colorIndex);

            const counter = colorDiv.querySelector('.selection-count');
            const newCount = state.selectedColors.filter(c => c === colorIndex).length;
            counter.textContent = newCount;
            counter.style.display = 'block';

            if (!colorDiv.classList.contains('selected')) {
                colorDiv.classList.add('selected');
            }
        }

        updateSelectedColorsDisplay();
        playBtn.disabled = state.selectedColors.length !== 6;
    }

    function validateBet(betAmount) {
        if (isNaN(betAmount)) {
            alert('Por favor, insira um valor numérico válido.');
            return false;
        }
        
        if (betAmount < 10) {
            alert('A aposta mínima é de R$ 10,00.');
            return false;
        }
        
        if (betAmount > 10000) {
            alert('A aposta máxima é de R$ 10.000,00.');
            return false;
        }
        
        if (betAmount > state.balance) {
            alert('Saldo insuficiente para esta aposta.');
            return false;
        }
        
        return true;
    }

    function playGame() {
        if (state.isRevealing) {
            alert('Aguarde a revelação da sequência atual!');
            return;
        }

        const betAmount = parseFloat(betAmountEl.value);
        
        if (!validateBet(betAmount)) {
            return;
        }

        state.isRevealing = true;
        playBtn.disabled = true;

        state.balance -= betAmount;
        const jackpotContribution = betAmount * 0.02;
        state.jackpot += jackpotContribution;
        state.jackpotContribution += jackpotContribution;

        state.gameCount++;
        state.lastGameTime = new Date();
        if (state.gameCount >= 5) {
            state.qualifiedForJackpot = true;
        }

        updateBalance();
        updateJackpot();

        const houseResults = [];
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * state.colors.length);
            houseResults.push(randomIndex);
        }

        revealResults(houseResults, betAmount);
        saveGameState();
    }

    function revealResults(houseResults, betAmount) {
        let delay = 0;

        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const resultEl = document.getElementById(`result${i}`);
                resultEl.style.transform = 'scale(0)';
                
                setTimeout(() => {
                    resultEl.style.backgroundColor = state.colors[houseResults[i]].hex;
                    resultEl.classList.add('revealed');
                    resultEl.title = state.colors[houseResults[i]].name;
                    resultEl.style.transform = 'scale(1)';
                    playSound('reveal');
                }, 150);

                if (i === 5) {
                    setTimeout(() => {
                        checkWin(houseResults, betAmount);
                        state.isRevealing = false;
                        playBtn.disabled = state.selectedColors.length !== 6;
                    }, 500);
                }
            }, delay);

            delay += 500;
        }
    }

    function updateSelectedColorsDisplay() {
        for (let i = 0; i < 6; i++) {
            const selectedEl = document.getElementById(`selected${i}`);
            selectedEl.style.backgroundColor = '';
            selectedEl.classList.remove('filled');
            selectedEl.title = '';
        }

        state.selectedColors.forEach((colorIndex, i) => {
            const selectedEl = document.getElementById(`selected${i}`);
            selectedEl.style.backgroundColor = state.colors[colorIndex].hex;
            selectedEl.classList.add('filled');
            selectedEl.title = state.colors[colorIndex].name;
        });
    }

    function resetSelection() {
        if (state.isRevealing) return;

        state.selectedColors = [];

        document.querySelectorAll('.color-option').forEach(div => {
            div.classList.remove('selected');
            const counter = div.querySelector('.selection-count');
            counter.style.display = 'none';
            counter.textContent = '';
        });

        for (let i = 0; i < 6; i++) {
            const selectedEl = document.getElementById(`selected${i}`);
            const resultEl = document.getElementById(`result${i}`);
            selectedEl.style.backgroundColor = '';
            selectedEl.classList.remove('filled');
            selectedEl.title = '';
            resultEl.style.backgroundColor = '';
            resultEl.classList.remove('revealed');
        }

        resultMessage.textContent = '';
        resultMessage.className = 'result-message';
        playBtn.disabled = true;
    }

    function checkWin(houseResults, betAmount) {
        let winAmount = 0;
        let winType = '';

        const playerColors = state.selectedColors;
        const exactMatch = arraysEqual(playerColors, houseResults);
        const alternating = isAlternatingColors(houseResults) && hasSameAlternatingColors(playerColors, houseResults);
        const hasTripleMatch = hasTriple(houseResults) && hasMatchingTriple(playerColors, houseResults);
        const hasPairsMatch = hasPairs(houseResults) && hasMatchingPairs(playerColors, houseResults);
        const rainbowMatch = allDifferentColors(houseResults) && allDifferentColors(playerColors) && 
                            playerColors.every(color => houseResults.includes(color));

        if (exactMatch && state.qualifiedForJackpot && state.houseProfitTotal > 0) {
            winAmount = state.jackpot;
            winType = 'Sequência Exata - JACKPOT!';
            state.jackpot = 100000;
            updateJackpot();
        } else if (exactMatch) {
            winAmount = betAmount * 1000;
            winType = 'Sequência Exata';
        } else if (alternating) {
            winAmount = betAmount * 500;
            winType = 'Cores Alternadas';
        } else if (hasTripleMatch) {
            winAmount = betAmount * 25;
            winType = 'Tripla Repetida';
        } else if (hasPairsMatch) {
            winAmount = betAmount * 5;
            winType = 'Par Encontrado';
        } else if (rainbowMatch) {
            winAmount = betAmount * 3;
            winType = 'Sequência Arco-Íris';
        }

        const gameResult = {
            bet: betAmount,
            playerColors: playerColors.map(idx => state.colors[idx].name),
            houseColors: houseResults.map(idx => state.colors[idx].name),
            winAmount: winAmount,
            winType: winType,
            timestamp: new Date()
        };

        state.gameHistory.unshift(gameResult);
        if (state.gameHistory.length > 10) {
            state.gameHistory.pop();
        }

        if (winAmount > 0) {
            playSound('win');
            state.balance += winAmount;
            updateBalance();
            resultMessage.textContent = `Você ganhou R$ ${winAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${winType})`;
            resultMessage.className = 'result-message win';
            state.houseProfitTotal -= (winAmount - betAmount);
        } else {
            playSound('lose');
            resultMessage.textContent = 'Você perdeu. Tente novamente!';
            resultMessage.className = 'result-message loss';
            state.houseProfitTotal += betAmount - state.jackpotContribution;
        }

        updateHistoryDisplay();
        saveGameState();
    }

    function hasMatchingTriple(playerColors, houseResults) {
        const houseCounts = countOccurrences(houseResults.map(idx => state.colors[idx].name));
        const playerCounts = countOccurrences(playerColors.map(idx => state.colors[idx].name));

        const tripleColor = Object.entries(houseCounts)
            .find(([_, count]) => count >= 3)?.[0];

        if (!tripleColor) return false;

        return playerCounts[tripleColor] >= 3;
    }

    function hasMatchingPairs(playerColors, houseResults) {
        const houseCounts = countOccurrences(houseResults.map(idx => state.colors[idx].name));
        const playerCounts = countOccurrences(playerColors.map(idx => state.colors[idx].name));

        const housePairs = Object.entries(houseCounts)
            .filter(([_, count]) => count >= 2);

        if (housePairs.length < 1) return false;

        for (const [color, count] of housePairs) {
            if (playerCounts[color] >= count) {
                return true;
            }
        }

        return false;
    }

    function hasSameAlternatingColors(playerColors, houseResults) {
        if (!isAlternatingColors(houseResults)) return false;

        for (let i = 0; i < playerColors.length; i++) {
            if (playerColors[i] !== houseResults[i]) {
                return false;
            }
        }
        return true;
    }

    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    function isAlternatingColors(arr) {
        if (arr.length < 2) return false;
        const color1 = arr[0];
        const color2 = arr[1];
        if (color1 === color2) return false;
        return arr.every((color, i) => color === (i % 2 === 0 ? color1 : color2));
    }

    function hasPairs(arr) {
        const counts = countOccurrences(arr);
        return Object.values(counts).some(count => count >= 2);
    }

    function hasTriple(arr) {
        const counts = countOccurrences(arr);
        return Object.values(counts).some(count => count >= 3);
    }

    function countOccurrences(arr) {
        const counts = {};
        for (const num of arr) {
            counts[num] = (counts[num] || 0) + 1;
        }
        return counts;
    }

    function allDifferentColors(arr) {
        return new Set(arr).size === arr.length;
    }

    function updateHistoryDisplay() {
        historyList.innerHTML = '';

        state.gameHistory.forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const info = document.createElement('div');
            info.textContent = `Aposta: R$ ${game.bet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            const result = document.createElement('div');
            if (game.winAmount > 0) {
                result.textContent = `Ganhou: R$ ${game.winAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${game.winType})`;
                result.style.color = '#4CAF50';
            } else {
                result.textContent = 'Perdeu';
                result.style.color = '#f44336';
            }

            historyItem.appendChild(info);
            historyItem.appendChild(result);
            historyList.appendChild(historyItem);
        });
    }

    function updateBalance() {
        balanceEl.textContent = `R$ ${state.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    function updateJackpot() {
        jackpotEl.textContent = `R$ ${state.jackpot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    initGame();
});

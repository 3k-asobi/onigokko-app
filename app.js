// ==========================================
// アプリの状態管理（データ）
// ==========================================
const appState = {
    selectedCharacter: null, 
    players: [],             
    isSpinning: false        
};

// ==========================================
// 画面が読み込まれたらスタート
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    renderCharGrid();        
    setupMyEventListeners(); 
    renderGroupSelect(); // 💾 保存済みグループリストを読み込む
});

// ==========================================
// 1. 16枚 of キャラクター選択画面を作る
// ==========================================
function renderCharGrid() {
    const charGrid = document.getElementById('char-grid');
    if (!charGrid) return;
    charGrid.innerHTML = '';

    for (let i = 1; i <= 16; i++) {
        const charId = i;
        const charName = `キャラ ${charId}`;
        const charImage = `chara${charId}.png`; 

        const card = document.createElement('div');
        card.className = 'char-card';
        card.dataset.id = charId;

        const img = document.createElement('img');
        img.src = charImage;
        img.alt = charName;

        card.appendChild(img);

        card.addEventListener('click', () => {
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            appState.selectedCharacter = { id: charId, name: charName, image: charImage };
        });

        charGrid.appendChild(card);
    }
}

// ==========================================
// 2. ボタン操作・レバー操作の設定
// ==========================================
function setupMyEventListeners() {
    const btnEntry = document.getElementById('btn-entry');
    const inputName = document.getElementById('player-name');
    const slotLever = document.getElementById('slot-lever');
    const slotContainer = document.getElementById('oni-slot-container');
    const slotReel = document.getElementById('slot-reel'); 
    const oniResult = document.getElementById('oni-result');
    const flashScreen = document.getElementById('flash-screen');

    // 👤 エントリー処理
    if (btnEntry) {
        btnEntry.addEventListener('click', () => {
            const name = inputName.value.trim();

            if (!name) {
                alert('プレイヤー名を入力してください！');
                return;
            }
            if (!appState.selectedCharacter) {
                alert('キャラクターを1人選んでください！');
                return;
            }

            appState.players.push({
                name: name,
                character: appState.selectedCharacter
            });

            inputName.value = '';
            
            // アイコンの選択状態を解除する
            appState.selectedCharacter = null;
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));

            renderPlayerList();
        });
    }

    // 🕹️ レバー処理
    if (slotLever) {
        slotLever.addEventListener('click', () => {
            if (appState.isSpinning) return;

            if (appState.players.length < 2) {
                alert('オニを決めるには、プレイヤーを2人以上エントリーしてください！');
                return;
            }

            appState.isSpinning = true;

            slotLever.classList.add('pulled');
            if (oniResult) oniResult.innerHTML = '';
            if (slotContainer) slotContainer.classList.remove('hit-shake');

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            const playLeverSound = () => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
            };
            playLeverSound();

            setTimeout(() => {
                slotLever.classList.remove('pulled');
                startReelSpin(audioCtx);
            }, 200);
        });
    }

    // 🎰 縦スクロール（物理スライド移動 ＆ VS Codeバグ完全対策版）
    function startReelSpin(audioCtx) {
        let pool = [];
        for (let i = 0; i < 15; i++) {
            pool = pool.concat(appState.players);
        }

        let html = '';
        pool.forEach(p => {
            html += `
                <div class="reel-item" style="height: 120px; box-sizing: border-box; border-top: 3px solid #000000; border-bottom: 3px solid #000000; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #ffffff; width: 100%; flex-shrink: 0;">
                    <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 0 auto;">
                        <img src="${p.character.image}" style="width: 100%; height: 100%; object-fit: contain; image-rendering: auto;">
                    </div>
                    <div class="slot-name" style="font-size: 0.95rem; font-weight: bold; color: #1f2833; margin-top: 6px; white-space: nowrap;">${p.name}</div>
                </div>
            `;
        });
        
        slotReel.innerHTML = html;
        slotReel.style.transition = "none";
        slotReel.style.transform = "translateY(0px)";

        const playTickSound = () => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        };

        const luckyIndex = Math.floor(Math.random() * appState.players.length);
        const targetTargetIndex = (appState.players.length * 11) + luckyIndex;
        const targetPlayer = appState.players[luckyIndex];

        let currentY = 0;
        let step = 0;
        const totalSteps = targetTargetIndex; 
        
        let currentInterval = 60; 
        
        function animate() {
            if (step < totalSteps) {
                step++;
                currentY -= 120; 
                slotReel.style.transition = `transform ${currentInterval}ms cubic-bezier(0.1, 0.8, 0.3, 1)`;
                slotReel.style.transform = `translateY(${currentY}px)`;
                
                playTickSound();

                const remaining = totalSteps - step;
                if (remaining < 10) {
                    currentInterval += 45; 
                } else if (remaining < 25) {
                    currentInterval += 12; 
                }

                setTimeout(animate, currentInterval);
            } else {
                setTimeout(() => {
                    finalizeSelection(audioCtx, targetPlayer);
                }, 200);
            }
        }

        setTimeout(animate, 100);
    }

    // 🎯 オニを最終決定して止める関数
    function finalizeSelection(audioCtx, luckyPlayer) {
        slotReel.style.transition = "none";
        slotReel.style.transform = "translateY(0px)";
        slotReel.innerHTML = `
            <div class="reel-item" style="height:120px; box-sizing:border-box; border-top:3px solid #000000; border-bottom:3px solid #000000; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#ffffff; width:100%;">
                <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 0 auto;">
                    <img src="${luckyPlayer.character.image}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="slot-name">${luckyPlayer.name}</div>
            </div>
        `;

        const playWinSound = () => {
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = (i === notes.length - 1) ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.06, audioCtx.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.5);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(audioCtx.currentTime + i * 0.08);
                osc.stop(audioCtx.currentTime + i * 0.08 + 0.6);
            });
        };

        if (slotContainer) slotContainer.classList.add('hit-shake');
        playWinSound();

        if (flashScreen) {
            flashScreen.classList.remove('trigger-flash');
            void flashScreen.offsetWidth;
            flashScreen.classList.add('trigger-flash');
        }

        if (oniResult) {
            oniResult.innerHTML = `
                <div class="oni-announced" style="display:flex; align-items:center; gap:15px; background:#251115; padding:15px 30px; border:2px solid #f39c12; border-radius:10px; box-shadow: 0 0 25px rgba(243,156,18,0.5);">
                    <div style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <img src="${luckyPlayer.character.image}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 8px #f39c12);">
                    </div>
                    <span style="font-size: 1.1rem; font-weight: bold; color: #fff;">鬼は 【${luckyPlayer.name}】 に決定</span>
                </div>
            `;
        }

        appState.isSpinning = false;
    }
}

// ==========================================
// 3. 参加メンバー一覧を表示（❌お休み/削除ボタン付き）
// ==========================================
function renderPlayerList() {
    const playerList = document.getElementById('player-list');
    if (!playerList) return;
    playerList.innerHTML = '';

    if (appState.players.length === 0) {
        playerList.innerHTML = `<p style="color:#7f8c8d; font-size:0.9rem; text-align:center; width:100%;">メンバーが登録されていません</p>`;
        return;
    }

    appState.players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'player-item';
        // 既存のplayer-itemデザインを損なわないよう、右端にそっとお休み削除ボタンを配置
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 5px 0; background: #1f2833; padding: 8px 12px; border-radius: 8px; width: 100%; box-sizing: border-box;';

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                    <img src="${player.character.image}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <span style="color: white; font-weight: bold;">${player.name}</span>
            </div>
            <button type="button" style="background: #e74c3c; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;" onclick="removePlayer(${index})">お休み / 削除</button>
        `;
        playerList.appendChild(item);
    });
}

// 👤 メンバーから特定の一人をその日だけお休み・削除する
window.removePlayer = function(index) {
    appState.players.splice(index, 1);
    renderPlayerList();
};

// ==========================================
// 💾 【完全無料・ローカル保存】グループ保存＆呼び出し機能
// ==========================================
// 1. グループ保存
window.saveCurrentGroup = function() {
    const groupNameInput = document.getElementById('group-name-input');
    const groupName = groupNameInput.value.trim();
    
    if (appState.players.length === 0) {
        alert("保存するメンバーがいません。メンバーを追加してから保存してください。");
        return;
    }
    if (!groupName) {
        alert("グループ名（例：水曜クラス など）を入力してください。");
        return;
    }

    // ローカルストレージから既存のグループデータを取得
    let savedGroups = JSON.parse(localStorage.getItem('savedPlayerGroups')) || {};
    
    // 現在のappState.playersをディープコピーして紐付け
    savedGroups[groupName] = JSON.parse(JSON.stringify(appState.players));
    
    localStorage.setItem('savedPlayerGroups', JSON.stringify(savedGroups));
    groupNameInput.value = "";
    alert(`グループ「${groupName}」を新しく保存しました！`);
    
    renderGroupSelect();
};

// 2. セレクトボックスの選択肢を更新
function renderGroupSelect() {
    const select = document.getElementById('group-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- 保存したグループを選択 --</option>';
    
    const savedGroups = JSON.parse(localStorage.getItem('savedPlayerGroups')) || {};
    Object.keys(savedGroups).forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        select.appendChild(option);
    });
}

// 3. 選択したグループをリストに呼び出す
window.loadSelectedGroup = function() {
    const select = document.getElementById('group-select');
    const selectedName = select.value;
    
    if (!selectedName) {
        alert("呼び出したいグループを選択してください。");
        return;
    }

    const savedGroups = JSON.parse(localStorage.getItem('savedPlayerGroups')) || {};
    if (savedGroups[selectedName]) {
        appState.players = JSON.parse(JSON.stringify(savedGroups[selectedName]));
        renderPlayerList();
        alert(`グループ「${selectedName}」のメンバーを呼び出しました！`);
    }
};

// 4. グループの削除
window.deleteSelectedGroup = function() {
    const select = document.getElementById('group-select');
    const selectedName = select.value;
    
    if (!selectedName) {
        alert("削除したいグループを選択してください。");
        return;
    }

    if (confirm(`本当にグループ「${selectedName}」を削除してもよろしいですか？`)) {
        let savedGroups = JSON.parse(localStorage.getItem('savedPlayerGroups')) || {};
        delete savedGroups[selectedName];
        localStorage.setItem('savedPlayerGroups', JSON.stringify(savedGroups));
        
        renderGroupSelect();
        alert(`グループ「${selectedName}」を削除しました。`);
    }
};


// ==========================================
// 🧭 ナビゲーション（画面遷移）
// ==========================================
function goToSelection() {
    if (appState.players.length === 0) {
        alert("まずはメンバーを登録（または呼び出し）してね！");
        return;
    }
    document.querySelector('.setup-section').style.display = 'none';
    document.querySelector('.oni-section').style.display = 'none';
    document.querySelector('.players-section').style.display = 'none';
    document.getElementById('nav-to-selection').style.display = 'none';
    
    document.getElementById('game-selection-section').style.display = 'block';
}

function goBackToEntry() {
    document.querySelector('.setup-section').style.display = 'block';
    document.querySelector('.oni-section').style.display = 'block';
    document.querySelector('.players-section').style.display = 'block';
    document.getElementById('nav-to-selection').style.display = 'block';
    
    document.getElementById('game-selection-section').style.display = 'none';
}

// ==========================================
// 🎰 スロット画面を開く際の、既存データ引き渡し処理
// ==========================================
function openSlotWindow() {
    try {
        const currentPlayers = appState && appState.players ? appState.players : [];
        
        // 既存の「登録プレイヤーデータ」をJSON形式で slot.html 側の指定キーに格納
        const formattedPlayers = currentPlayers.map(p => ({
            name: p.name,
            icon: p.character.image // 既存の character.image を icon キーに変換
        }));

        localStorage.setItem('registeredPlayers', JSON.stringify(formattedPlayers));
        
        window.open('slot.html', '_blank');
    } catch (e) {
        console.error("スロット起動中にエラーが発生しました:", e);
        window.open('slot.html', '_blank');
    }
}

// 🎰 ボタンのクリックイベントと、別タブ結果の同期登録
document.addEventListener('DOMContentLoaded', () => {
    const btnOpenSlot = document.getElementById('btn-open-slot');
    if (btnOpenSlot) {
        btnOpenSlot.addEventListener('click', openSlotWindow);
    }
});

// 🔄 別タブで鬼が決まったら、メイン画面の結果欄にも自動反映する監視
window.addEventListener('storage', (event) => {
    if (event.key === 'latestOniResult') {
        const resultBox = document.getElementById('oni-result');
        if (resultBox && event.newValue) {
            resultBox.innerHTML = `
                <div class="oni-announced" style="display:inline-flex; align-items:center; background:#251115; padding:10px 20px; border:2px solid #f39c12; border-radius:10px; color: #fff; font-weight: bold; gap: 10px;">
                    <span>👹 鬼は 【 ${event.newValue} 】 に決定！</span>
                </div>
            `;
            resultBox.classList.add('show');
        }
    }
});


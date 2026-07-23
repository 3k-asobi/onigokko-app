/* --- game-normal.js (通常のおにごっこ専用) --- */

const spec = {
    title: "おにごっこ",
    defaultGameTime: 120,
    defaultInterval: 10,
    rule: "プレイヤーは鬼にタッチされないように全力で逃げよう！タッチされたらそのプレイヤーが次の鬼になります。その時はタッチされたプレイヤーのボタンをタップしてインターバルが自動でスタート！インターバル中は鬼はタッチできません。経過後に再スタートになるよ！"
};

document.getElementById('game-title').textContent = spec.title;
document.getElementById('rule-box').innerHTML = spec.rule;
document.getElementById('input-game-time').value = spec.defaultGameTime;
document.getElementById('input-interval-time').value = spec.defaultInterval;

const players = JSON.parse(localStorage.getItem('registeredPlayers')) || [];
const oniCounts = {};
players.forEach(p => oniCounts[p.name] = 0);

let oniHistory = [];
let currentOni = localStorage.getItem('latestOniResult') || "";
if (currentOni && oniCounts[currentOni] !== undefined) {
    oniCounts[currentOni] = 1;
}

let mainTimer = null;
let isPlaying = false;
let isInterval = false;
let isIntervalWaiting = false;
let isStartingSequence = false;
let timeLeft = spec.defaultGameTime;
let intervalLeft = spec.defaultInterval;

// ==========================================
// 🎵 音声・効果音 コントロール関数群
// ==========================================
function isBgmEnabled() {
    const bgmSetting = document.querySelector('input[name="bgm-toggle"]:checked');
    return bgmSetting && bgmSetting.value === 'on';
}

function playBgm() {
    if (!isBgmEnabled()) return;
    const bgm = document.getElementById('bgm-horror');
    if (bgm) {
        bgm.volume = 0.4;
        bgm.play().catch(e => console.log("BGM再生エラー:", e));
    }
}

function pauseBgm() {
    const bgm = document.getElementById('bgm-horror');
    if (bgm) {
        bgm.pause();
    }
}

function stopBgm() {
    const bgm = document.getElementById('bgm-horror');
    if (bgm) {
        bgm.pause();
        bgm.currentTime = 0;
    }
}

// 🔊 カウントダウン効果音の再生（頭出し処理付き）
function playCountSE() {
    const se = document.getElementById('se-count');
    if (se) {
        se.pause();
        se.currentTime = 0; // 最初に戻す
        se.play().catch(e => console.log("SE再生エラー:", e));
    }
}

// 🛑 カウントダウン効果音を完全ストップ
function stopCountSE() {
    const se = document.getElementById('se-count');
    if (se) {
        se.pause();
        se.currentTime = 0;
    }
}

function renderCounters() {
    const grid = document.getElementById('counter-grid');
    grid.innerHTML = "";
    
    players.forEach(p => {
        const card = document.createElement('div');
        card.className = `counter-card ${p.name === currentOni ? 'is-oni' : ''}`;
        card.innerHTML = `
            <img src="${p.icon}" style="width:35px; height:35px; object-fit:contain; display:block; margin:0 auto;">
            <div style="font-size:0.85rem; font-weight:bold; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:3px;">${p.name}</div>
            <div class="counter-count">
                <span class="count-number">${oniCounts[p.name]}</span>回
            </div>
        `;
        
        card.onclick = () => {
            if (!isPlaying && !isStartingSequence) {
                setFirstOni(p.name);
            } else if (isPlaying && !isStartingSequence) {
                changeOni(p.name);
            }
        };
        grid.appendChild(card);
    });

    if (currentOni) {
        document.getElementById('current-oni-name').textContent = currentOni;
        document.getElementById('current-oni-name').style.color = "#ff3344";
    } else {
        document.getElementById('current-oni-name').textContent = "(カードをタップして決定)";
        document.getElementById('current-oni-name').style.color = "#bdc3c7";
    }
}

function setFirstOni(name) {
    players.forEach(p => oniCounts[p.name] = 0);
    currentOni = name;
    oniCounts[name] = 1;
    renderCounters();
    speak(`さいしょのおには、${name}にきまりました！`);
}

function changeOni(newName) {
    if (isInterval || isIntervalWaiting) return;
    
    currentOni = newName;
    oniCounts[newName]++;
    oniHistory.push(newName);
    renderCounters();

    intervalLeft = parseInt(document.getElementById('input-interval-time').value) || 0;

    if (intervalLeft > 0) {
        isIntervalWaiting = true; 
        pauseBgm(); // ⏸️ タッチ時にBGM一時停止

        document.getElementById('timer-status-top').textContent = `⏳ まもなくインターバル開始...`;
        document.getElementById('timer-status-top').style.color = "#f39c12";
        document.getElementById('timer-status-bottom').textContent = "";
        document.getElementById('timer-display').textContent = intervalLeft;
        document.getElementById('timer-display').style.color = "#f39c12";

        speak(`おにこうたい！つぎのおには、${newName}。インターバルスタート。`, 1.1, 'ja-JP', () => {
            isIntervalWaiting = false;
            isInterval = true;
            document.getElementById('timer-status-top').innerHTML = `<span style="color: #e67e22;">⏳ インターバル中！</span>`;
            document.getElementById('timer-status-bottom').innerHTML = `<span style="color: #ff3344;">プレイヤーは逃げて！</span>`;
            
            // 💡 読み上げ終了時は画面に「10」を表示し、効果音は鳴らさずに待機する
            document.getElementById('timer-display').textContent = intervalLeft;
        });
    } else {
        speak(`おにこうたい！つぎのおには、${newName}。`);
    }
}

function toggleGame() {
    if (!currentOni) {
        alert("最初のオニをタップして選んでからスタートしてね！");
        speak("さいしょのおにを、えらんでね！");
        return;
    }

    if (isStartingSequence) return;

    const btn = document.getElementById('btn-start');
    
    if (!isPlaying) {
        isStartingSequence = true;
        btn.textContent = "準備中...";
        btn.classList.add('stop');
        document.getElementById('setup-box').querySelectorAll('input').forEach(i => i.disabled = true);
        
        document.getElementById('timer-status-top').textContent = `🚦 まもなくスタート！`;
        document.getElementById('timer-status-top').style.color = "#f1c40f";
        document.getElementById('timer-status-bottom').textContent = "";

        playStartSequenceBeeps(() => {
            isStartingSequence = false;
            isPlaying = true;
            btn.textContent = "ストップ";
            
            oniHistory = [currentOni];
            timeLeft = parseInt(document.getElementById('input-game-time').value) || spec.defaultGameTime;
            document.getElementById('timer-display').textContent = formatTime(timeLeft);
            
            playBgm();
            speak("Let's start!", 1.0, 'en-US');
            document.getElementById('timer-status-top').textContent = `🏃‍♂️ おにごっこ中！全力で走れ！`;
            document.getElementById('timer-status-top').style.color = "#2ecc71";
            document.getElementById('timer-status-bottom').textContent = "";

            mainTimer = setInterval(() => {
                if (isIntervalWaiting) {
                    document.getElementById('timer-display').textContent = intervalLeft;
                } else if (isInterval) {
                    // 💡 1秒経ったらまずカウントを下げる（10 → 9 へ）
                    intervalLeft--;

                    if (intervalLeft <= 0) {
                        // 🛑 インターバル終了時に効果音を即時ピタッとストップ！
                        stopCountSE();
                        
                        isInterval = false;
                        document.getElementById('timer-status-top').textContent = `🏃‍♂️ おにごっこ中！全力で走れ！`;
                        document.getElementById('timer-status-top').style.color = "#2ecc71";
                        document.getElementById('timer-status-bottom').textContent = "";
                        document.getElementById('timer-display').style.color = "#2ecc71";
                        playBeep(true); // 明ける時は高めの電子音
                        playBgm();
                        speak("Let's start!", 1.0, 'en-US');
                    } else {
                        // 💡 カウント9以降から1秒刻みで画面更新＆効果音再生
                        document.getElementById('timer-display').textContent = intervalLeft;
                        document.getElementById('timer-display').style.color = "#f39c12";
                        playCountSE();
                    }
                } else {
                    timeLeft--;
                    document.getElementById('timer-display').textContent = formatTime(timeLeft);
                    
                    if (timeLeft <= 10 && timeLeft > 0) {
                        playBeep(false);
                    }

                    if (timeLeft <= 0) {
                        endGame();
                    }
                }
            }, 1000);
        });

    } else {
        endGame();
    }
}

function endGame() {
    clearInterval(mainTimer);
    isPlaying = false;
    isInterval = false;
    isIntervalWaiting = false;
    
    stopBgm();
    stopCountSE(); // 🛑 試合終了時にも効果音を即時停止

    const btn = document.getElementById('btn-start');
    btn.textContent = "スタート！";
    btn.classList.remove('stop');
    document.getElementById('setup-box').querySelectorAll('input').forEach(i => i.disabled = false);
    
    document.getElementById('timer-status-top').textContent = `🏁 終了！おつかれさまでした！`;
    document.getElementById('timer-status-top').style.color = "#ffff00";
    document.getElementById('timer-status-bottom').textContent = "";
    document.getElementById('timer-display').style.color = "#2ecc71";
    
    playWhistle(() => {
        speakEnglishTimesUp();
    });
    
    showResultModal();
}

function showResultModal() {
    const nonOniPlayers = players.filter(p => p.name !== currentOni);
    
    let winners = [];
    let mvps = [];
    
    if (nonOniPlayers.length === 0) {
        winners = ["なし (全員が鬼、またはプレイヤーが1人のみ)"];
        mvps = ["なし"];
    } else {
        winners = nonOniPlayers.map(p => p.name);
        
        let minCount = Infinity;
        nonOniPlayers.forEach(p => {
            const count = oniCounts[p.name] || 0;
            if (count < minCount) {
                minCount = count;
                mvps = [p.name];
            } else if (count === minCount) {
                mvps.push(p.name);
            }
        });
    }

    const winnerText = winners.join('、');
    document.getElementById('result-winner-names').textContent = winnerText;

    const mvpText = mvps.join('、');
    document.getElementById('result-mvp-names').textContent = mvpText;

    const historyBox = document.getElementById('result-history');
    if (oniHistory.length === 0) {
        historyBox.innerHTML = "<span style='color:#bdc3c7;'>記録なし</span>";
    } else {
        let html = "";
        oniHistory.forEach((name, index) => {
            html += `<span class="history-step">${index + 1}. ${name}</span>`;
            if (index < oniHistory.length - 1) {
                html += `<span class="history-arrow">➔</span>`;
            }
        });
        historyBox.innerHTML = html;
    }

    const scoresBox = document.getElementById('result-scores');
    scoresBox.innerHTML = "";
    players.forEach(p => {
        const row = document.createElement('div');
        row.className = "score-row";
        row.innerHTML = `
            <span>${p.name} ${p.name === currentOni ? '<span style="color:#ff3344; font-size:0.8rem; font-weight:bold;">[最後の鬼]</span>' : ''}</span>
            <span style="font-weight:bold; color:#f1c40f;">${oniCounts[p.name]} 回</span>
        `;
        scoresBox.appendChild(row);
    });

    document.getElementById('result-overlay').style.display = 'flex';
}

renderCounters();
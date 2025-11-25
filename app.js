// ============================================
// 2. 設定區：請將剛剛複製的 Firebase 設定貼在下面
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDD2aX8628LlV5MgzagDwnMdk6jMpaYBAE",
    authDomain: "tokyo-disney-trip-2026-09.firebaseapp.com",
    projectId: "tokyo-disney-trip-2026-09",
    storageBucket: "tokyo-disney-trip-2026-09.firebasestorage.app",
    messagingSenderId: "854341418564",
    appId: "1:854341418564:web:2e3a808a62e30f8d4c0611",
    measurementId: "G-ZQXG5V3VJG"
};

// 3. 初始化 Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 核心邏輯 ---

// (行程資料保持不變)
const tripData = [
    {
        date: '9/15 (Day 1)',
        items: [
            { type: 'transport', color: '#0369A1', bg: '#E0F2FE', label: '交通', time: '13:10', title: '抵達東京成田', desc: '取車單號：<span class="hl-code">TR-9982</span>' },
            { type: 'spot', color: '#BE123C', bg: '#FFE4E6', label: '景點', time: '15:30', title: '台場獨角獸鋼彈', desc: '每小時有變身秀。' },
            { type: 'food', color: '#C2410C', bg: '#FFEDD5', label: '晚餐', time: '18:00', title: 'Afuri 柚子鹽拉麵', desc: '必點：<span class="hl-must">柚子鹽拉麵</span>' }
        ]
    },
    {
        date: '9/16 (Day 2)',
        items: [
            { type: 'transport', color: '#0369A1', bg: '#E0F2FE', label: '交通', time: '08:00', title: '自駕 -> 迪士尼', desc: '導航: DisneySea Parking' },
            { type: 'spot', color: '#BE123C', bg: '#FFE4E6', label: '樂園', time: '09:00', title: '東京迪士尼海洋', desc: '<span class="hl-must">Fantasy Springs</span> 務必抽 DPA' },
            { type: 'food', color: '#C2410C', bg: '#FFEDD5', label: '午餐', time: '12:30', title: '麥哲倫餐廳', desc: '預約：<span class="hl-code">RES-2026-0916</span>' }
        ]
    }
];

let activeDayIndex = 0;

// 初始化
function init() {
    renderDates();
    renderItinerary();
    listenToExpenses(); // 啟動雲端監聽
}

// --- Firebase 記帳功能 ---

// 監聽雲端資料庫 (這就是即時同步的關鍵！)
function listenToExpenses() {
    // 監聽 "expenses" 這個集合，按時間排序
    db.collection("expenses").orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            const list = document.getElementById('expenseList');
            list.innerHTML = '';
            let total = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;
                total += data.amount;

                const item = document.createElement('div');
                item.className = 'card';
                item.style.padding = '16px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.innerHTML = `
                            <span style="font-weight:500;">${data.name}</span>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-weight:bold;">$${data.amount.toLocaleString()}</span>
                                <button onclick="deleteExpense('${id}')" class="delete-btn">✕</button>
                            </div>
                        `;
                list.appendChild(item);
            });

            document.getElementById('totalAmount').innerText = '$' + total.toLocaleString();
            document.getElementById('remainAmount').innerText = '$' + (100000 - total).toLocaleString();
        });
}

// 新增資料到雲端
function addExpense() {
    const name = document.getElementById('expenseName').value;
    const amount = parseInt(document.getElementById('expenseCost').value);

    if (!name || isNaN(amount)) return;

    // 寫入 Firebase
    db.collection("expenses").add({
        name: name,
        amount: amount,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('expenseName').value = '';
        document.getElementById('expenseCost').value = '';
    }).catch((error) => {
        console.error("Error:", error);
        alert("新增失敗，請檢查網路！");
    });
}

// 刪除資料
function deleteExpense(id) {
    if (confirm('確定刪除？')) {
        db.collection("expenses").doc(id).delete();
    }
}

// --- 頁面邏輯 (跟之前一樣) ---
function switchTab(tabName, btnEl) {
    document.getElementById('view-itinerary').classList.add('hidden');
    document.getElementById('view-info').classList.add('hidden');
    document.getElementById('view-budget').classList.add('hidden');
    document.getElementById(`view-${tabName}`).classList.remove('hidden');

    const titles = { 'itinerary': '行程安排', 'info': '重要資訊', 'budget': '雲端記帳' };
    document.getElementById('pageTitle').innerText = titles[tabName];

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
}

function renderDates() {
    const container = document.getElementById('dateContainer');
    container.innerHTML = '';
    tripData.forEach((day, index) => {
        const btn = document.createElement('div');
        btn.className = `date-pill ${index === activeDayIndex ? 'active' : ''}`;
        btn.innerText = day.date;
        btn.onclick = () => {
            activeDayIndex = index;
            renderDates();
            renderItinerary();
        };
        container.appendChild(btn);
    });
}

function renderItinerary() {
    const list = document.getElementById('itineraryList');
    list.innerHTML = '';
    tripData[activeDayIndex].items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
                    <div class="border-line" style="background-color: ${item.color}"></div>
                    <div style="margin-left: 8px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-size:12px; font-weight:bold; color:#A8A29E;">${item.time}</span>
                            <span class="tag" style="background:${item.bg}; color:${item.color}; border:1px solid ${item.bg}">${item.label}</span>
                        </div>
                        <h3 style="margin: 4px 0 8px 0; font-size:18px;">${item.title}</h3>
                        <div style="font-size:14px; color:#57534E; line-height:1.5;">${item.desc}</div>
                        <div style="margin-top:12px; padding-top:12px; border-top:1px solid #F5F5F4;">
                            <a href="#" class="btn btn-nav">📍 開啟導航</a>
                        </div>
                    </div>
                `;
        list.appendChild(card);
    });
}

init();
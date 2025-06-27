// Firebase config - include your databaseURL
const firebaseConfig = {
  apiKey: "AIzaSyDKePOssOWlyp8IvHjGWFimsK6PbYyRL-8",
  authDomain: "monad-fok-list.firebaseapp.com",
  databaseURL: "https://monad-fok-list-default-rtdb.firebaseio.com",
  projectId: "monad-fok-list",
  storageBucket: "monad-fok-list.appspot.com",
  messagingSenderId: "801044070772",
  appId: "1:801044070772:web:047438563c453dbbd9ac21",
  measurementId: "G-0WHKZE0JR7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const leaderboardEl = document.getElementById('leaderboard');
const searchEl = document.getElementById('search');
const addBtn = document.getElementById('addBtn');
const addForm = document.getElementById('addForm');
const submitAdd = document.getElementById('submitAdd');
const cancelAdd = document.getElementById('cancelAdd');

const fokVoteCounts = {};   // Track 🖕🏿 votes per person per session
const loveVoteCounts = {};  // Track 💜 votes per person per session
const fokCooldowns = {};    // Track cooldown per person for 🖕🏿
const loveCooldowns = {};   // Track cooldown per person for 💜

function renderList(items) {
  leaderboardEl.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-item';

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5em;">
        <span>${item.realPosition}.</span>
        <img src="https://unavatar.io/twitter/${item.twitter}" alt="pfp">
        <a href="https://x.com/${item.twitter}" target="_blank" style="color: white;">${item.name}</a>
      </div>
      <div class="vote-buttons">
        <span class="fok-btn">🖕🏿 ${item.foks}</span>
        <span class="love-btn">💜 ${item.loves}</span>
      </div>
    `;

    const fokBtn = row.querySelector('.fok-btn');
    const loveBtn = row.querySelector('.love-btn');

    fokVoteCounts[item.id] = fokVoteCounts[item.id] || 0;
    loveVoteCounts[item.id] = loveVoteCounts[item.id] || 0;

    fokBtn.onclick = () => {
      if (fokCooldowns[item.id]) return;

      fokVoteCounts[item.id]++;

      if (fokVoteCounts[item.id] >= 100) {
        fokCooldowns[item.id] = true;
        fokBtn.style.opacity = '0.5';
        setTimeout(() => {
          fokCooldowns[item.id] = false;
          fokVoteCounts[item.id] = 0;
          fokBtn.style.opacity = '1';
        }, 60000); // 1-minute cooldown
      } else {
        db.ref('users/' + item.id + '/foks').transaction(current => (current || 0) + 1);
      }
    };

    loveBtn.onclick = () => {
      if (loveCooldowns[item.id]) return;

      loveVoteCounts[item.id]++;

      if (loveVoteCounts[item.id] >= 100) {
        loveCooldowns[item.id] = true;
        loveBtn.style.opacity = '0.5';
        setTimeout(() => {
          loveCooldowns[item.id] = false;
          loveVoteCounts[item.id] = 0;
          loveBtn.style.opacity = '1';
        }, 60000); // 1-minute cooldown
      } else {
        db.ref('users/' + item.id + '/loves').transaction(current => (current || 0) + 1);
      }
    };

    leaderboardEl.appendChild(row);
  });
}

function fetchAndRender() {
  db.ref('users').once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      leaderboardEl.innerHTML = '<p style="color: white;">No entries yet. Add someone!</p>';
      return;
    }

    const items = [];
    for (const key in data) {
      items.push({ id: key, ...data[key] });
    }

    // Sort by total votes (foks + loves), tie-breaker by foks
    items.sort((a, b) => {
      const totalA = a.foks + a.loves;
      const totalB = b.foks + b.loves;
      if (totalB !== totalA) return totalB - totalA;
      return b.foks - a.foks;
    });

    const searchValue = searchEl.value.trim().toLowerCase();

    if (searchValue) {
      const filtered = items
        .map((item, index) => ({
          ...item,
          realPosition: index + 1
        }))
        .filter(item =>
          item.name.toLowerCase().includes(searchValue)
        );

      renderList(filtered);
    } else {
      const topItems = items.slice(0, 100).map((item, index) => ({
        ...item,
        realPosition: index + 1
      }));
      renderList(topItems);
    }
  });
}

db.ref('users').on('value', fetchAndRender);

// Show add form
addBtn.onclick = () => {
  addForm.classList.add('show');
};

// Cancel add form
cancelAdd.onclick = () => {
  addForm.classList.remove('show');
};

// Search functionality
searchEl.oninput = fetchAndRender;

// Submit new name
submitAdd.onclick = () => {
  const name = document.getElementById('newName').value.trim();
  const twitterLink = document.getElementById('newTwitter').value.trim();
  const twitter = twitterLink
    .replace('https://twitter.com/', '')
    .replace('https://x.com/', '')
    .replace('twitter.com/', '')
    .replace('x.com/', '')
    .replace('/', '')
    .trim();

  if (!name || !twitter) {
    alert('Please fill all fields properly.');
    return;
  }

  db.ref('users').once('value').then(snapshot => {
    const data = snapshot.val() || {};
    const isDuplicate = Object.values(data).some(
      item =>
        item.name.toLowerCase() === name.toLowerCase() ||
        item.twitter.toLowerCase() === twitter.toLowerCase()
    );

    if (isDuplicate) {
      alert('This name or Twitter is already on the list.');
      return;
    }

    const newRef = db.ref('users').push();
    newRef.set({
      name,
      twitter,
      foks: 0,
      loves: 0
    });

    addForm.classList.remove('show');
    document.getElementById('newName').value = '';
    document.getElementById('newTwitter').value = '';
  });
};
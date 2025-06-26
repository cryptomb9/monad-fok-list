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

// Fetch and render leaderboard
function renderList(snapshot) {
  const data = snapshot.val();
  if (!data) {
    leaderboardEl.innerHTML = '<p style="color: white;">No entries yet. Add someone!</p>';
    return;
  }

  const items = [];
  for (const key in data) {
    items.push({ id: key, ...data[key] });
  }

  // Sort by foks descending
  items.sort((a, b) => b.foks - a.foks);

  leaderboardEl.innerHTML = '';

  items.forEach((item, index) => {
    if (index >= 100 && searchEl.value.trim() === '') return;

    const row = document.createElement('div');
    row.className = 'leaderboard-item';

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5em;">
        <span>${index + 1}.</span>
        <img src="https://unavatar.io/twitter/${item.twitter}" alt="pfp">
        <a href="https://x.com/${item.twitter}" target="_blank" style="color: white;">${item.name}</a>
      </div>
      <div class="vote-buttons">
        <span class="fok-btn">🖕🏿 ${item.foks}</span>
        <span class="love-btn">💜 ${item.loves}</span>
      </div>
    `;

    row.querySelector('.fok-btn').onclick = () => {
      db.ref('users/' + item.id + '/foks').transaction(current => (current || 0) + 1);
    };

    row.querySelector('.love-btn').onclick = () => {
      db.ref('users/' + item.id + '/loves').transaction(current => (current || 0) + 1);
    };

    leaderboardEl.appendChild(row);
  });
}

db.ref('users').on('value', renderList);

// Search functionality
searchEl.oninput = () => {
  const filter = searchEl.value.trim().toLowerCase();
  db.ref('users').once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      leaderboardEl.innerHTML = '<p style="color: white;">No matches found.</p>';
      return;
    }

    const filteredItems = [];
    for (const key in data) {
      if (data[key].name.toLowerCase().includes(filter)) {
        filteredItems.push({ id: key, ...data[key] });
      }
    }

    filteredItems.sort((a, b) => b.foks - a.foks);

    leaderboardEl.innerHTML = '';
    filteredItems.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-item';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5em;">
          <span>${index + 1}.</span>
          <img src="https://unavatar.io/twitter/${item.twitter}" alt="pfp">
          <a href="https://x.com/${item.twitter}" target="_blank" style="color: white;">${item.name}</a>
        </div>
        <div class="vote-buttons">
          <span class="fok-btn">🖕🏿 ${item.foks}</span>
          <span class="love-btn">💜 ${item.loves}</span>
        </div>
      `;

      row.querySelector('.fok-btn').onclick = () => {
        db.ref('users/' + item.id + '/foks').set(item.foks + 1);
      };

      row.querySelector('.love-btn').onclick = () => {
        db.ref('users/' + item.id + '/loves').set(item.loves + 1);
      };

      leaderboardEl.appendChild(row);
    });
  });
};

// Show add form
addBtn.onclick = () => {
  addForm.classList.remove('hidden');
};

// Cancel add form
cancelAdd.onclick = () => {
  addForm.classList.add('hidden');
};

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

    addForm.classList.add('hidden');
    document.getElementById('newName').value = '';
    document.getElementById('newTwitter').value = '';
  });
};
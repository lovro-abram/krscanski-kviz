document.addEventListener('DOMContentLoaded', () => {
  const questionsContainer = document.getElementById('questions-container');
  const favoritesContainer = document.getElementById('favorites-container');
  const searchInput = document.getElementById('search-input');
  const resultsCount = document.getElementById('results-count');
  const resetBtn = document.querySelector('.reset-btn');
  const sortButtons = document.querySelectorAll('.sort-btn');
  const showFavoritesBtn = document.getElementById('show-favorites-btn');
  const favoritesCount = document.getElementById('favorites-count');

  let questions = [];
  let filteredQuestions = [];
  let allCategories = new Set();
  let favoriteQuestions = new Set();
  let activeFilters = { difficulties: [], categories: [], searchQuery: '', sortBy: 'difficulty' };
  let showOnlyFavorites = false;

  fetch('vprasanja.json')
    .then(r => r.json())
    .then(data => {
      questions = data.map((q, i) => ({ ...q, id: q.id || i + 1 }));
      loadFavorites();
      data.forEach(q => q.kategorije.forEach(k => allCategories.add(k)));

      const sortedCategories = Array.from(allCategories).sort();
      const categoryFilters = document.getElementById('category-filters');
      sortedCategories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.innerHTML = `
          <input type="checkbox" id="category-${cat.replace(/\s+/g, '-')}">
          <label for="category-${cat.replace(/\s+/g, '-')}">${cat}</label>
          <span class="filter-count" id="count-category-${cat.replace(/\s+/g, '-')}">0</span>
        `;
        categoryFilters.appendChild(div);
      });

      updateActiveFilters();
      updateCounters();
      applyFilters();
      displayFavorites();
      setupFilterEvents();
    })
    .catch(err => {
      console.error(err);
      questionsContainer.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle" style="font-size:3rem;margin-bottom:1rem;"></i><h3>Napaka pri nalaganju vprašanj</h3><p>Preverite, ali datoteka vprasanja.json obstaja.</p></div>';
    });

  function loadFavorites() {
    const saved = localStorage.getItem('favoriteQuestions');
    if (saved) favoriteQuestions = new Set(JSON.parse(saved));
    updateFavoritesCount();
  }
  function saveFavorites() {
    localStorage.setItem('favoriteQuestions', JSON.stringify([...favoriteQuestions]));
    updateFavoritesCount();
  }
  function updateFavoritesCount() {
    if (favoritesCount) favoritesCount.textContent = favoriteQuestions.size;
  }

  function displayQuestions(list) {
    if (!list.length) {
      questionsContainer.innerHTML = '<div class="no-results"><i class="fas fa-search" style="font-size:3rem;margin-bottom:1rem;"></i><h3>Ni ustreznih vprašanj</h3><p>Spremenite iskalne pogoje.</p></div>';
      return;
    }
    questionsContainer.innerHTML = '';
    list.forEach(q => {
      const isFav = favoriteQuestions.has(q.id);
      const card = document.createElement('div');
      card.className = `question-card difficulty-${q.težavnost}`;
      card.innerHTML = `
        <div class="question-header">
          <div class="question-difficulty difficulty-badge-${q.težavnost}">Težavnost: ${q.težavnost}/5</div>
          <button class="favorite-btn ${isFav ? 'active' : ''}"><i class="fas fa-heart"></i></button>
        </div>
        <div class="question-text">${q.vprašanje}</div>
        <div class="answer">${q.odgovor}</div>
        <div class="question-categories">${q.kategorije.map(k => `<div class="category-tag"><i class="fas fa-tag"></i> ${k}</div>`).join('')}</div>
      `;
      card.querySelector('.favorite-btn').addEventListener('click', function () {
        toggleFavorite(q.id);
        this.classList.toggle('active');
        displayFavorites();
      });
      questionsContainer.appendChild(card);
    });
    resultsCount.textContent = list.length;
  }

  function displayFavorites() {
    const favList = questions.filter(q => favoriteQuestions.has(q.id));
    if (!favList.length) {
      favoritesContainer.innerHTML = '<div class="no-results"><i class="fas fa-heart" style="font-size:3rem;margin-bottom:1rem;color:#ddd;"></i><h3>Ni priljubljenih vprašanj</h3><p>Kliknite srček ob vprašanju, da ga dodate.</p></div>';
      return;
    }
    favoritesContainer.innerHTML = '';
    favList.forEach(q => {
      const card = document.createElement('div');
      card.className = `question-card difficulty-${q.težavnost}`;
      card.innerHTML = `
        <div class="question-header">
          <div class="question-difficulty difficulty-badge-${q.težavnost}">Težavnost: ${q.težavnost}/5</div>
          <button class="favorite-btn active"><i class="fas fa-heart"></i></button>
        </div>
        <div class="question-text">${q.vprašanje}</div>
        <div class="answer">${q.odgovor}</div>
        <div class="question-categories">${q.kategorije.map(k => `<div class="category-tag"><i class="fas fa-tag"></i> ${k}</div>`).join('')}</div>
      `;
      card.querySelector('.favorite-btn').addEventListener('click', () => {
        toggleFavorite(q.id);
        displayFavorites();
        applyFilters();
      });
      favoritesContainer.appendChild(card);
    });
  }

  function toggleFavorite(id) {
    favoriteQuestions.has(id) ? favoriteQuestions.delete(id) : favoriteQuestions.add(id);
    saveFavorites();
  }

  function updateActiveFilters() {
    activeFilters.difficulties = [];
    document.querySelectorAll('#difficulty-filters input:not(#difficulty-all)').forEach(cb => {
      if (cb.checked) {
        activeFilters.difficulties.push(parseInt(cb.id.split('-')[1]));
      }
    });

    activeFilters.categories = [];
    document.querySelectorAll('#category-filters input:not(#category-all)').forEach(cb => {
      if (cb.checked) {
        activeFilters.categories.push(cb.id.replace('category-', '').replace(/-/g, ' '));
      }
    });
  }

  function applyFilters() {
    let filtered = questions.filter(q => {
      if (showOnlyFavorites && !favoriteQuestions.has(q.id)) return false;

      if (!activeFilters.difficulties.includes(q.težavnost)) return false;

      const hasCat = q.kategorije.some(k => activeFilters.categories.includes(k));
      if (!hasCat) return false;

      if (activeFilters.searchQuery) {
        const query = activeFilters.searchQuery.toLowerCase();
        if (!q.vprašanje.toLowerCase().includes(query) && !q.odgovor.toLowerCase().includes(query)) return false;
      }
      return true;
    });
    if (activeFilters.sortBy === 'difficulty') filtered.sort((a, b) => a.težavnost - b.težavnost);
    if (activeFilters.sortBy === 'alphabetical') filtered.sort((a, b) => a.vprašanje.localeCompare(b.vprašanje, 'sl'));
    filteredQuestions = filtered;
    displayQuestions(filtered);
  }

  function updateCounters() {
    const countDiffAll = document.getElementById('count-difficulty-all');
    if (countDiffAll) countDiffAll.textContent = questions.length;
    for (let i = 1; i <= 5; i++) {
      const countDiff = document.getElementById(`count-difficulty-${i}`);
      if (countDiff) countDiff.textContent = questions.filter(q => q.težavnost === i).length;
    }
    const countCatAll = document.getElementById('count-category-all');
    if (countCatAll) countCatAll.textContent = questions.length;
    allCategories.forEach(cat => {
      const count = questions.filter(q => q.kategorije.includes(cat)).length;
      const countCat = document.getElementById(`count-category-${cat.replace(/\s+/g, '-')}`);
      if (countCat) countCat.textContent = count;
    });
  }

  function setupFilterEvents() {
    // difficulty
    document.getElementById('difficulty-filters').addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT') {
        const cb = e.target;
        const allCbs = document.querySelectorAll('#difficulty-filters input:not(#difficulty-all)');

        if (cb.id === 'difficulty-all') {
          allCbs.forEach(x => x.checked = cb.checked);
        } else {
          const allChecked = Array.from(allCbs).every(x => x.checked);
          document.getElementById('difficulty-all').checked = allChecked;
        }

        updateActiveFilters();
        applyFilters();
      }
    });

    // categories
    document.getElementById('category-filters').addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT') {
        const cb = e.target;
        const allCbs = document.querySelectorAll('#category-filters input:not(#category-all)');

        if (cb.id === 'category-all') {
          allCbs.forEach(x => x.checked = cb.checked);
        } else {
          const allChecked = Array.from(allCbs).every(x => x.checked);
          document.getElementById('category-all').checked = allChecked;
        }

        updateActiveFilters();
        applyFilters();
      }
    });

    // search
    searchInput.addEventListener('input', () => {
      activeFilters.searchQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
    // sort
    sortButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        sortButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilters.sortBy = this.dataset.sort;
        applyFilters();
      });
    });
    // show only favs
    showFavoritesBtn.addEventListener('click', function () {
      showOnlyFavorites = !showOnlyFavorites;
      if (showOnlyFavorites) {
        this.innerHTML = '<i class="fas fa-times"></i> Prikaži vsa vprašanja';
        this.style.background = 'var(--gray)';
      } else {
        this.innerHTML = '<i class="fas fa-heart"></i> Prikaži priljubljene <span class="favorites-count">' + favoriteQuestions.size + '</span>';
        this.style.background = 'var(--favorite)';
      }
      applyFilters();
    });
    // reset
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
      searchInput.value = '';
      sortButtons.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-sort="difficulty"]').classList.add('active');
      showOnlyFavorites = false;
      showFavoritesBtn.innerHTML = '<i class="fas fa-heart"></i> Prikaži priljubljene <span class="favorites-count">' + favoriteQuestions.size + '</span>';
      showFavoritesBtn.style.background = 'var(--favorite)';
      activeFilters.searchQuery = '';
      activeFilters.sortBy = 'difficulty';
      updateActiveFilters();
      applyFilters();
    });
  }

  // ---------- DELJENJE BESEDILA ----------
  const shareModal = document.getElementById('shareModal');
  const shareCancel = document.getElementById('shareCancel');
  const shareCopy = document.getElementById('shareCopy');

  const shareBtn = document.createElement('button');
  shareBtn.className = 'show-favorites-btn';
  shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Deli priljubljena';
  shareBtn.style.background = '#17a2b8';

  const exportFavPdfBtn = document.createElement('button');
  exportFavPdfBtn.className = 'show-favorites-btn';
  exportFavPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Izvozi PDF';
  exportFavPdfBtn.style.background = '#27ae60';

  const favHeader = document.querySelector('.favorites-header');
  if (favHeader) {
    const btnGroup = document.createElement('div');
    btnGroup.className = 'fav-btn-group';
    btnGroup.appendChild(shareBtn);
    btnGroup.appendChild(exportFavPdfBtn);
    favHeader.appendChild(btnGroup);
  }

  shareBtn.onclick = () => {
    if (!favoriteQuestions.size) return alert('Nimate še priljubljenih vprašanj.');
    shareModal.style.display = 'flex';
  };

  exportFavPdfBtn.onclick = () => {
    const favList = questions.filter(q => favoriteQuestions.has(q.id));
    if (!favList.length) return alert('Nimate še priljubljenih vprašanj.');
    exportQuestionsToPdf(favList, "priljubljena_vprašanja.pdf");
  };
  if (shareCancel) shareCancel.onclick = () => shareModal.style.display = 'none';

  // ---------- PDF IZVOZ ----------
  const exportPdfBtn = document.getElementById('export-pdf-all');
  if (exportPdfBtn) {
    exportPdfBtn.onclick = () => {
      exportQuestionsToPdf(filteredQuestions, "vprasanja_kviz.pdf");
    };
  }

  function exportQuestionsToPdf(list, filename) {
    if (!list.length) return alert('Ni vprašanj za izvoz.');

    const includeAnswers = confirm("Ali želite v PDF vključiti tudi odgovore?");

    const element = document.createElement('div');
    element.className = 'pdf-export-container';

    let html = `<h1 class="pdf-export-title">Krščanski Kviz - Seznam vprašanj</h1>`;
    html += `<p class="pdf-export-date">Datum: ${new Date().toLocaleDateString('sl-SI')}</p>`;
    html += `<hr class="pdf-export-hr">`;

    list.forEach((q, idx) => {
      html += `
        <div class="pdf-item">
          <div class="pdf-item-question">${idx + 1}. ${q.vprašanje}</div>
          <div class="pdf-item-meta">
            Težavnost: ${q.težavnost}/5 | Kategorije: ${q.kategorije.join(', ')}
          </div>
          ${includeAnswers ? `<div class="pdf-item-answer">Odgovor: ${q.odgovor}</div>` : ''}
        </div>
      `;
    });

    element.innerHTML = html;

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  }

  if (shareCopy) {
    shareCopy.onclick = () => {
      const opts = {
        vpr: document.getElementById('shareVpr').checked,
        odg: document.getElementById('shareOdg').checked,
        tez: document.getElementById('shareTez').checked,
        kat: document.getElementById('shareKat').checked
      };
      if (!opts.vpr && !opts.odg && !opts.tez && !opts.kat) return alert('Izberite vsaj eno možnost.');
      const favQs = questions.filter(q => favoriteQuestions.has(q.id));
      let lines = [];
      favQs.forEach((q, idx) => {
        const num = `${idx + 1}.`;
        if (opts.vpr) lines.push(`${num} ${q.vprašanje}`);
        if (opts.odg) lines.push(`   Odgovor: ${q.odgovor}`);
        if (opts.tez) lines.push(`   Težavnost: ${q.težavnost}/5`);
        if (opts.kat) lines.push(`   Kategorije: ${q.kategorije.join(', ')}`);
        lines.push('');
      });
      const text = lines.join('\n');
      navigator.clipboard.writeText(text).then(() => {
        alert('Vsebina kopirana v odložišče!');
        shareModal.style.display = 'none';
      }).catch(err => {
        alert('Napaka pri kopiranju: ' + err);
      });
    };
  }
});

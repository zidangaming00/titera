const fs = require('fs'); // Fix 1: Huruf kecil 'c'

async function masakHTML() {

    let semuaBerita = [];

    // 1. Robot mengambil data via API Terintegrasi
    try {
        console.log("Mengambil berita dari API...");
        const res = await fetch('https://news.searchdata.workers.dev?category=terkini');
        const data = await res.json();
        
        // Memastikan format balikan API tertampung dengan benar
        semuaBerita = Array.isArray(data) ? data : (data.data || data.items || []);
    } catch (e) {
        console.log("Gagal mengambil dari API terintegrasi:", e);
    }

    // 2. Acak dan ambil 10 berita untuk halaman depan
    semuaBerita = semuaBerita.sort(() => Math.random() - 0.5).slice(0, 10);

    // 3. Susun menjadi elemen HTML persis seperti desain titik tiga terbaru
    let htmlBerita = '';
    semuaBerita.forEach(item => {
        let thumb = item.thumb || item.enclosure?.link || item.thumbnail || (item.description?.match(/<img[^>]+src="([^">]+)"/)?.[1]) || 'https://via.placeholder.com/100?text=News';
        const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${item.domain}`;
        
        // Format Tanggal (Selaras dengan perbaikan di frontend)
        let displayDate = item.pubDate || '';
        if (item.pubDate) {
            let dateString = item.pubDate;
            if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
                dateString = dateString.replace(' ', 'T') + 'Z'; 
            }
            
            const newsDate = new Date(dateString);
            
            if (!isNaN(newsDate.getTime())) {
                const now = new Date();
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);

                const timeStr = newsDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
                
                if (newsDate.toDateString() === now.toDateString()) {
                    displayDate = `Hari ini, ${timeStr}`;
                } else if (newsDate.toDateString() === yesterday.toDateString()) {
                    displayDate = `Kemarin, ${timeStr}`;
                } else {
                    displayDate = `${newsDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                }
            }
        }

        // Fix 2: Bikin data item untuk fungsi save
        const itemData = encodeURIComponent(JSON.stringify({
            title: item.title,
            link: item.link,
            sourceName: item.sourceName,
            domain: item.domain,
            pubDate: displayDate,
            thumb: thumb || '',
            fromStorage: true
        }));

        // Fix 3: Default isSaved adalah false saat di-build oleh Node.js 
        // (Karena SSR tidak bisa membaca localStorage user)
        const isSaved = false;

        htmlBerita += `
        <a class="news-item" href="${item.link}" target="_blank" onmousedown="applyRipple(event)">
            <div class="news-img-wrapper loaded">
                <img src="${thumb}" class="news-img" onerror="this.src='https://via.placeholder.com/100?text=News'">
            </div>
            <div class="news-info" style="display: flex; flex-direction: column; min-width: 0;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div class="source-wrapper" style="margin-bottom: 0;">
                        <img src="${iconUrl}" class="news-favicon" alt="icon">
                        <span class="source-tag">${item.sourceName}</span>
                    </div>
                    
                    <div class="dropdown-container">
                        <button class="three-dot-btn" onclick="toggleNewsMenu(event, this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2.2"></circle>
                                <circle cx="12" cy="12" r="2.2"></circle>
                                <circle cx="12" cy="19" r="2.2"></circle>
                            </svg>
                        </button>
                        <div class="news-dropdown">
                            <button class="dropdown-item" data-item="${itemData}" onclick="toggleSaveNews(event, this)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                <span class="action-text">Simpan Berita</span>
                            </button>
                            <button class="dropdown-item" data-title="${item.title.replace(/"/g, '&quot;')}" data-link="${item.link}" onclick="shareNews(event, this)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                <span>Bagikan Berita</span>
                            </button>
                            <button class="dropdown-item" onclick="reportNewsContent(event, this)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                <span>Laporkan Konten</span>
                            </button>
                        </div>
                    </div>
                </div>

                <h3 class="news-headline">${item.title}</h3>
                
                <div class="news-time" style="margin-top: auto;">${displayDate}</div>
            </div>
        </a>
        `;
    });

    // 4. Buka template.html, ganti penanda dengan HTML berita matang
    try {
        let template = fs.readFileSync('template.html', 'utf-8');
        template = template.replace('<!-- BERITA_TERKINI_DISINI -->', htmlBerita);

        // 5. Simpan hasilnya menjadi index.html
        fs.writeFileSync('index.html', template);
        console.log("Selesai! Berhasil merakit index.html dengan data dari API.");
    } catch (err) {
        console.error("Gagal membaca atau menulis file HTML:", err);
    }
}

masakHTML();

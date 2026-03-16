const fs = require('fs');

async function masakHTML() {

    // 1. Daftar sumber berita Terkini
    const sumberTerkini = [
        { name: 'Detik', url: 'https://news.detik.com/berita/rss', domain: 'detik.com' },
        { name: 'CNBC Indo', url: 'https://www.cnbcindonesia.com/news/rss', domain: 'cnbcindonesia.com' },
        { name: 'Antara', url: 'https://www.antaranews.com/rss/terkini.xml', domain: 'antaranews.com' }
    ];

    let semuaBerita = [];

    // 2. Robot mengambil data via RSS2JSON
    for (const sumber of sumberTerkini) {
        try {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(sumber.url)}`);
            const data = await res.json();
            if (data.status === 'ok') {
                const items = data.items.map(i => ({ ...i, sourceName: sumber.name, domain: sumber.domain }));
                semuaBerita.push(...items);
            }
        } catch (e) {
            console.log(`Gagal mengambil dari ${sumber.name}`);
        }
    }

    // Acak dan ambil 10 berita untuk halaman depan
    semuaBerita = semuaBerita.sort(() => Math.random() - 0.5).slice(0, 10);

    // 3. Susun menjadi elemen HTML persis seperti desainmu
    let htmlBerita = '';
    semuaBerita.forEach(item => {
        let thumb = item.enclosure?.link || item.thumbnail || (item.description?.match(/<img[^>]+src="([^">]+)"/)?.[1]) || 'https://via.placeholder.com/100?text=News';
        const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${item.domain}`;
        
        const newsDate = new Date(item.pubDate.replace(' ', 'T') + 'Z');
        const now = new Date();
        let displayDate = newsDate.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
        if (newsDate.toDateString() === now.toDateString()) displayDate = `Hari ini, ${displayDate}`;
        else displayDate = `${newsDate.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}, ${displayDate}`;

        // PERUBAHAN DI SINI: Menukar posisi wrapper gambar ke atas wrapper teks
        htmlBerita += `
        <a class="news-item" href="${item.link}" target="_blank">
            <div class="news-img-wrapper loaded">
                <img src="${thumb}" class="news-img" onerror="this.src='https://via.placeholder.com/100?text=News'">
            </div>
            <div class="news-info">
                <div class="source-wrapper">
                    <img src="${iconUrl}" class="news-favicon" alt="icon">
                    <span class="source-tag">${item.sourceName}</span>
                </div>
                <button data-item="${itemData}" onclick="toggleSaveNews(event, this)" style="position:absolute;right:16px;bottom:5px; background: none; border: none; cursor: pointer; color: ${isSaved ? 'var(--google-blue)' : 'var(--text-gray)'}; padding: 4px; margin: -4px -4px 0 0; border-radius: 50%; transition: transform 0.2s ease, color 0.2s; -webkit-tap-highlight-color: transparent;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
                            
                <h3 class="news-headline">${item.title}</h3>
                <div class="news-time">${displayDate}</div>
            </div>
        </a>
        `;
    });

    // 4. Buka template.html, ganti penanda dengan HTML berita matang
    let template = fs.readFileSync('template.html', 'utf-8');
    template = template.replace('<!-- BERITA_TERKINI_DISINI -->', htmlBerita);

    // 5. Simpan hasilnya menjadi index.html
    fs.writeFileSync('index.html', template);
    console.log("Selesai! Berhasil merakit index.html dengan thumbnail di kiri.");
}

masakHTML();

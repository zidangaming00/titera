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
        let displayDate = newsDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        htmlBerita += `
        <a class="news-item" href="${item.link}" target="_blank">
            <div class="news-info">
                <div class="source-wrapper">
                    <img src="${iconUrl}" class="news-favicon" alt="icon">
                    <span class="source-tag">${item.sourceName}</span>
                </div>
                <h3 class="news-headline">${item.title}</h3>
                <div class="news-time">${displayDate}</div>
            </div>
            <div class="news-img-wrapper loaded">
                <img src="${thumb}" class="news-img" onerror="this.src='https://via.placeholder.com/100?text=News'">
            </div>
        </a>
        `;
    });

    // 4. Buka template.html, ganti penanda dengan HTML berita matang
    let template = fs.readFileSync('template.html', 'utf-8');
    template = template.replace('', htmlBerita);

    // 5. Simpan hasilnya menjadi index.html
    fs.writeFileSync('index.html', template);
    console.log("Selesai! Berhasil merakit index.html");
}

masakHTML();

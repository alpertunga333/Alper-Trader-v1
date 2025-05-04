# KriptoPilot - Binance Kripto Alım Satım Botu

KriptoPilot, Binance borsasında otomatik alım satım işlemleri yapmak üzere tasarlanmış bir kripto para botudur. Çeşitli teknik analiz stratejilerini destekler, Telegram entegrasyonu ile bildirimler gönderir ve kullanıcı dostu bir web arayüzü sunar.

## ✨ Özellikler

*   **Binance API Entegrasyonu:**
    *   Spot, Futures, Testnet Spot ve Testnet Futures için ayrı API anahtarı desteği.
    *   Güvenli API anahtarı yönetimi.
    *   Piyasa verilerini çekme ve alım satım emirleri gönderme.
*   **Telegram Entegrasyonu:**
    *   Açılan/kapatılan işlemler, hatalar ve diğer önemli bildirimler için otomatik Telegram mesajları.
*   **Teknik Analiz Stratejileri:**
    *   30 adet popüler ve yaygın olarak kullanılan teknik analiz stratejisi içerir (örn. Fibonacci, Hacim Analizi, RSI, Ichimoku, SMC).
    *   Modüler yapı sayesinde kolayca yeni strateji ekleme/çıkarma imkanı.
*   **Web Kontrol Paneli:**
    *   Anlık portföy görüntüleme.
    *   Detaylı işlem geçmişi takibi.
    *   Hata ve işlem log kayıtları.
    *   Parite grafikleri üzerinde alım/satım noktalarını görselleştirme.
    *   Strateji seçimi ve yönetimi.
    *   Botu başlatma/durdurma kontrolü.
*   **Geriye Dönük Test (Backtesting):**
    *   Seçilen stratejileri geçmiş veriler üzerinde test ederek performans analizi yapma.
*   **Risk Yönetimi:**
    *   Zararı Durdur (Stop-Loss) ve Kar Al (Take-Profit) seviyeleri belirleme.
*   **Kullanıcı Yönetimi:**
    *   Farklı API anahtar setleri için basit kullanıcı profilleri (Geliştirme aşamasındadır).
*   **Güvenlik:**
    *   API anahtarlarının güvenli bir şekilde saklanması ve kullanılmasına yönelik temel önlemler.

## 🚀 Kurulum

Bu proje Next.js ile geliştirilmiştir. Başlamak için aşağıdaki adımları takip edin:

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/kullanici-adiniz/KriptoPilot.git
    cd KriptoPilot
    ```

2.  **Gerekli Paketleri Yükleyin:**
    Proje kök dizinindeyken aşağıdaki komutu çalıştırın:
    ```bash
    npm install
    # veya
    yarn install
    ```
    *(Not: Bu proje Node.js paket yöneticisi (npm veya yarn) kullandığı için `requirements.txt` dosyası yerine `package.json` dosyasını kullanır.)*

3.  **Ortam Değişkenlerini Yapılandırın:**
    Proje kök dizininde `.env.local` adında bir dosya oluşturun. Bu dosyaya Binance API anahtarlarınızı, Telegram bot token'ınızı ve chat ID'nizi ekleyin. Güvenlik nedeniyle bu dosyayı Git'e göndermeyin (`.gitignore` dosyasında listelenmiştir).
    ```dotenv
    # Binance API (İsteğe bağlı olarak farklı ortamlar için ekleyin)
    BINANCE_API_KEY_SPOT=YOUR_SPOT_API_KEY
    BINANCE_SECRET_KEY_SPOT=YOUR_SPOT_SECRET_KEY
    # BINANCE_API_KEY_FUTURES=...
    # BINANCE_SECRET_KEY_FUTURES=...
    # BINANCE_API_KEY_TESTNET_SPOT=...
    # BINANCE_SECRET_KEY_TESTNET_SPOT=...
    # BINANCE_API_KEY_TESTNET_FUTURES=...
    # BINANCE_SECRET_KEY_TESTNET_FUTURES=...

    # Telegram Bot
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID

    # Google GenAI (Eğer AI özellikleri kullanılıyorsa)
    GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_API_KEY
    ```
    *   **Önemli:** API anahtarlarınızı asla herkese açık yerlerde paylaşmayın. `.env.local` dosyasını kullanmak, anahtarlarınızı koddan ayrı tutmanın güvenli bir yoludur.

4.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    # veya
    yarn dev
    ```
    Uygulama varsayılan olarak `http://localhost:9002` adresinde çalışacaktır.

5.  **Uygulamayı Derleyin (Production):**
    Uygulamayı canlıya almak için aşağıdaki komutları kullanabilirsiniz:
    ```bash
    npm run build
    npm run start
    # veya
    yarn build
    yarn start
    ```

## 🛠️ Kullanım

1.  Uygulamayı başlattıktan sonra web arayüzüne gidin (`http://localhost:9002`).
2.  **API Ayarları:** İlgili bölümlerden Binance (Spot, Futures, Testnet) ve Telegram API bilgilerinizi girip kaydedin.
3.  **Strateji Seçimi:** "Stratejiler" bölümünden kullanmak istediğiniz teknik analiz stratejilerini seçin.
4.  **Risk Yönetimi:** İsteğe bağlı olarak "Risk Yönetimi" bölümünden Zarar Durdur ve Kar Al yüzdelerini ayarlayın.
5.  **Botu Başlat:** Kontrol panelindeki "Başlat" butonu ile botu aktif hale getirin. Bot seçtiğiniz stratejilere göre belirlediğiniz paritelerde işlem yapmaya başlayacaktır.
6.  **İzleme:** "Portföy", "İşlem Geçmişi" ve "Log Kayıtları" sekmelerinden botun durumunu ve işlemlerini takip edin. Grafik üzerinden alım/satım noktalarını gözlemleyin.
7.  **Geriye Dönük Test:** Yeni stratejiler veya ayarlar denemeden önce "Geriye Dönük Test" bölümünü kullanarak performanslarını geçmiş verilerle değerlendirin.

## 🤝 Katkıda Bulunma

Katkılarınız memnuniyetle karşılanır! Lütfen bir "issue" açın veya "pull request" gönderin.

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız (Eğer varsa).

## ⚠️ Sorumluluk Reddi

Kripto para ticareti yüksek risk içerir. Bu botu kullanmak tamamen kendi sorumluluğunuzdadır. Yazılım hataları, API sorunları veya piyasa dalgalanmaları nedeniyle oluşabilecek finansal kayıplardan geliştirici sorumlu tutulamaz. Botu kullanmadan önce yeterli araştırma yapın ve riskleri anladığınızdan emin olun. Özellikle canlı piyasada kullanmadan önce Testnet üzerinde kapsamlı testler yapmanız şiddetle tavsiye edilir.
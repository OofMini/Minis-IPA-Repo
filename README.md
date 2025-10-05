<!-- 🌌 Mini’s IPA Repo — Animated README with Hidden CSS and Equal App Cards -->

<!-- 🔹 Header Banner -->
<div align="center" style="
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #2b0057, #001f4d);
  background-size: 400% 400%;
  animation: gradientShift 12s ease infinite;
  border-radius: 20px;
  padding: 60px 20px;
  color: white;
  font-family: 'Inter', 'Segoe UI', sans-serif;
">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png" width="110" height="110" style="
    border-radius: 24px;
    box-shadow: 0 0 20px rgba(255,255,255,0.3);
    margin-bottom: 20px;
    animation: float 5s ease-in-out infinite;
  " alt="Mini's IPA Repo Icon">

  <h1 style="font-size: 2.8em; font-weight: 700; margin: 0; animation: glowText 3s ease-in-out infinite alternate;">
    Mini’s IPA Repo
  </h1>
  <p style="font-size: 1.2em; margin-top: 8px; opacity: 0.9;">Tweaks • Jailbreak Tools • Premium Apps</p>

  <div style="margin-top: 20px;">
    <a href="trollapps://add-repo?url=https://oofmini.github.io/Minis-IPA-Repo/trollapps.json">
      <img src="https://img.shields.io/badge/Add%20to-TrollApps-blue?logo=apple&logoColor=white" alt="Add to TrollApps" style="margin:4px;">
    </a>
    <a href="sidestore://add-repo?url=https://oofmini.github.io/Minis-IPA-Repo/sidestore.json">
      <img src="https://img.shields.io/badge/Add%20to-SideStore-purple?logo=apple&logoColor=white" alt="Add to SideStore" style="margin:4px;">
    </a>
  </div>
</div>

<!-- 🔹 Intro -->
<p align="center" style="max-width:700px; margin:40px auto; font-size:1em;">
  Welcome to <b>Mini’s IPA Repo</b> — a curated collection of <b>tweaked apps</b> and <b>modern jailbreak utilities</b> built for <b>SideStore</b> and <b>TrollApps</b>.  
  Everything here is updated, optimized, and ready for iOS 15+.
</p>

<!-- 🔹 Hidden CSS (functional, not visible on GitHub) -->
<details hidden>
<!-- Hidden styling -->
<style>
@keyframes gradientShift {
  0% {background-position: 0% 50%;}
  50% {background-position: 100% 50%;}
  100% {background-position: 0% 50%;}
}
@keyframes float {
  0%, 100% {transform: translateY(0);}
  50% {transform: translateY(-8px);}
}
@keyframes glowText {
  from {text-shadow: 0 0 8px #a66bff, 0 0 15px #006eff;}
  to {text-shadow: 0 0 18px #d0a6ff, 0 0 28px #4da6ff;}
}
@keyframes fadeIn {
  from {opacity: 0; transform: translateY(15px);}
  to {opacity: 1; transform: translateY(0);}
}

.app-card {
  display: inline-block;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  width: 250px;
  height: 360px;
  margin: 15px;
  padding: 15px;
  text-align: center;
  vertical-align: top;
  transition: all 0.3s ease;
  animation: fadeIn 1s ease both;
  overflow: hidden;
}
.app-card:hover {
  transform: scale(1.05);
  background: rgba(255,255,255,0.15);
}
.app-card img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(255,255,255,0.15);
}
.app-card h3 {
  margin-top: 10px;
  color: #fff;
  font-size: 1.05em;
}
.app-card p {
  font-size: 0.85em;
  color: #ccc;
  height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.download-btn {
  display: inline-block;
  margin-top: 10px;
  padding: 6px 14px;
  border-radius: 10px;
  background: #1db954;
  color: #fff;
  text-decoration: none;
  transition: 0.3s;
}
.download-btn:hover { opacity: 0.8; }

@media (prefers-color-scheme: light) {
  .app-card {
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(0,0,0,0.1);
  }
  .app-card p { color: #333; }
  .download-btn { background: #007aff; }
}
</style>
</details>

<!-- 🔹 App Previews -->
<div align="center">

<div class="app-card">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/EeveeSpotify.png" alt="EeveeSpotify Icon">
  <h3>EeveeSpotify</h3>
  <p>By <b>whoeevee</b><br>Tweaked Spotify with premium features unlocked, no ads, and enhanced playback.</p>
  <a class="download-btn" href="https://github.com/OofMini/eeveespotifyreborn/releases/download/9.0.84/EeveeSpotify.ipa">Download</a>
</div>

<div class="app-card">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/YouTubePlus_5.2b3.PNG" alt="YTLite Icon">
  <h3>YTLite</h3>
  <p>By <b>dayanch96</b><br>Tweaked YouTube with background playback, no ads, and picture-in-picture.</p>
  <a class="download-btn" href="https://github.com/OofMini/YTLite/releases/download/20.39.6/YouTubePlus_5.2b3.ipa">Download</a>
</div>

<div class="app-card">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/NeoFreeBird.png" alt="NeoFreeBird Icon">
  <h3>X (NeoFreeBird)</h3>
  <p>By <b>NeoFreeBird</b><br>Tweaked Twitter/X with premium features, custom tools, and performance improvements.</p>
  <a class="download-btn" href="https://github.com/OofMini/tweak/releases/download/11.27/NeoFreeBird-sideloaded_5.1_11.27.ipa">Download</a>
</div>

<div class="app-card">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/Inshot.png" alt="InShot Pro Icon">
  <h3>InShot Pro</h3>
  <p>By <b>IPAOMTK</b><br>Pro video editor with premium filters, tools, and no watermark.</p>
  <a class="download-btn" href="https://www.dropbox.com/scl/fi/z9pg3t8e5rkauyh51duud/InShot-ipaomtk.com.ipa?rlkey=whj0y0ex86tondgcdn9t7dxnv&dl=1">Download</a>
</div>

<div class="app-card">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/Dopamine2.png" alt="Dopamine 2 Icon">
  <h3>Dopamine 2</h3>
  <p>By <b>opa334</b><br>Semi-untethered jailbreak for iOS 15+ with tweak injection and rootless environment.</p>
  <a class="download-btn" href="https://www.dropbox.com/scl/fi/83gkrrb2hq5nzv15e2f7q/Dopamine.tipa?rlkey=4tmq856xa31pqqw3t499gxm3z&dl=1">Download</a>
</div>

<div class="app-card">
  <img src="https://OofMini.github.io/Minis-IPA-Repo/apps/Dopamine2-roothide.png" alt="Dopamine 2 Roothide Icon">
  <h3>Dopamine 2 (Roothide)</h3>
  <p>By <b>roothide</b><br>Systemless variant with stealth and improved compatibility for iOS 15+.</p>
  <a class="download-btn" href="https://www.dropbox.com/scl/fi/5b0ir4tyyzsyfrvoyr98u/Dopamine-2.tipa?rlkey=bjaykx5qol2uueo8jbaarxnfe&dl=1">Download</a>
</div>

</div>

---

### 🌐 Repo Links

📦 **Website:** [https://oofmini.github.io/Minis-IPA-Repo/](https://oofmini.github.io/Minis-IPA-Repo/)  
📜 **SideStore JSON:** `https://OofMini.github.io/Minis-IPA-Repo/sidestore.json`  
📜 **TrollApps JSON:** `https://OofMini.github.io/Minis-IPA-Repo/trollapps.json`

/**
 * Simple GDPR/DSGVO cookie consent banner
 */
(function() {
  // Check if user already consented
  if (localStorage.getItem('cookieConsent')) {
    if (localStorage.getItem('cookieConsent') === 'accepted') {
      enableGoogleAnalytics();
    }
    return;
  }

  // Create consent banner
  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML = `
    <div class="cookie-content">
      <p>This website uses cookies to ensure you get the best experience. 
      By continuing to use this site, you consent to the use of cookies in accordance with our 
      <a href="/privacy">Privacy Policy</a>.</p>
      <div class="cookie-buttons">
        <button onclick="acceptCookies()">Accept</button>
        <button onclick="declineCookies()">Decline</button>
      </div>
    </div>
  `;
  
  // Add banner when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(banner);
    });
  } else {
    document.body.appendChild(banner);
  }
})();

function acceptCookies() {
  localStorage.setItem('cookieConsent', 'accepted');
  document.getElementById('cookie-consent-banner').remove();
  enableGoogleAnalytics();
}

function declineCookies() {
  localStorage.setItem('cookieConsent', 'declined');
  document.getElementById('cookie-consent-banner').remove();
}

function enableGoogleAnalytics() {
  // Only load Google Analytics if consent was given
  if (typeof window.ga === 'undefined' && localStorage.getItem('cookieConsent') === 'accepted') {
    // Add Google Analytics code here if needed
    // This is just a placeholder - your actual GA code should be in the site config
    console.log('Google Analytics enabled');
  }
}
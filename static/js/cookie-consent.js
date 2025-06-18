/**
 * Simple GDPR/DSGVO cookie consent banner
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check if user already consented
  if (!localStorage.getItem('cookieConsent')) {
    // Create consent banner
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-content">
        <p>This website uses cookies to ensure you get the best experience. 
        By continuing to use this site, you consent to the use of cookies in accordance with our 
        <a href="/privacy">Privacy Policy</a>.</p>
        <div class="cookie-buttons">
          <button id="cookie-accept">Accept</button>
          <button id="cookie-decline">Decline</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('cookie-accept').addEventListener('click', function() {
      localStorage.setItem('cookieConsent', 'accepted');
      banner.style.display = 'none';
      enableGoogleAnalytics();
    });
    
    document.getElementById('cookie-decline').addEventListener('click', function() {
      localStorage.setItem('cookieConsent', 'declined');
      banner.style.display = 'none';
    });
  } else if (localStorage.getItem('cookieConsent') === 'accepted') {
    enableGoogleAnalytics();
  }
});

function enableGoogleAnalytics() {
  // Only load Google Analytics if consent was given
  if (typeof window.ga === 'undefined' && localStorage.getItem('cookieConsent') === 'accepted') {
    // Add Google Analytics code here if needed
    // This is just a placeholder - your actual GA code should be in the site config
    console.log('Google Analytics enabled');
  }
}
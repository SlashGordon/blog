/**
 * Simple contact information obfuscation
 */

// Encrypted data (Base64 + character shift)
const encEmail = "dG1idGkvaHBzZXBvL2Vmd0FobmJqbS9kcG4=";
const encName = "RGlzanR1cHFpIUVqZmRs"; 
const encAddress1 = "Qm4hSWJvaCE4"; 
const encAddress2 = "MzIzNTUhQ3ZkaWlwbXsham8hZWZzIU9wc2VpZmplZg=="; 
const encPhone = "LDU6Mjg1NDY2Mzc6Nw=="; 

/**
 * Decrypts an encoded string
 * @param {string} encoded - Base64 encoded string with character shift
 * @returns {string} Decrypted string
 */
function decrypt(encoded) {
  const decoded = atob(encoded);
  return decoded.split('').map(c => 
    String.fromCharCode(c.charCodeAt(0) - 1)
  ).join('');
}

/**
 * Initialize contact information when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  // Add CSS for obfuscation
  const style = document.createElement('style');
  style.textContent = `
    .obfuscated-char::before {
      content: attr(data-char);
    }
    .obfuscated-email::before {
      content: attr(data-user) '\\0040' attr(data-domain);
    }
  `;
  document.head.appendChild(style);
  
  // Find all elements with data-obfuscated-email attribute
  document.querySelectorAll('[data-obfuscated-email]').forEach(element => {
    const email = decrypt(encEmail);
    const [user, domain] = email.split('@');
    
    element.innerHTML = '';
    element.className = 'obfuscated-email';
    element.setAttribute('data-user', user);
    element.setAttribute('data-domain', domain);
    
    // If it's a link, set the href attribute
    if (element.tagName === 'A') {
      element.setAttribute('href', 'javascript:window.location.href="mailto:"+decrypt("' + encEmail + '")');
    }
  });

  // Process all elements with data-obfuscated attribute
  document.querySelectorAll('[data-obfuscated]').forEach(element => {
    const type = element.getAttribute('data-obfuscated');
    let encoded = '';
    
    switch(type) {
      case 'name': encoded = encName; break;
      case 'address1': encoded = encAddress1; break;
      case 'address2': encoded = encAddress2; break;
      case 'phone': encoded = encPhone; break;
      default: return;
    }
    
    const text = decrypt(encoded);
    element.innerHTML = '';
    
    // Split text into individual characters and apply as data attributes
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.setAttribute('data-char', text[i]);
      span.className = 'obfuscated-char';
      element.appendChild(span);
    }
    
    // If it's a phone link, set the href attribute
    if (element.tagName === 'A' && type === 'phone') {
      element.setAttribute('href', 'javascript:window.location.href="tel:"+decrypt("' + encoded + '")');
    }
  });
});
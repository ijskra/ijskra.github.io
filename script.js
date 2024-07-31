// script.js

document.addEventListener('DOMContentLoaded', function() {
    // Load bio content
    fetch('bio.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('bio-content').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading bio:', error);
        });

    // Read More button functionality
    const readMoreBtn = document.getElementById('read-more');
    const bioContent = document.getElementById('bio-content');
    
    readMoreBtn.addEventListener('click', function() {
        if (bioContent.style.display === 'none' || bioContent.style.display === '') {
            bioContent.style.display = 'block';
            readMoreBtn.textContent = 'Read Less';
        } else {
            bioContent.style.display = 'none';
            readMoreBtn.textContent = 'Read More';
        }
    });

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Language selector functionality
    document.getElementById('language-select').addEventListener('change', function() {
        var lang = this.value;
        if (lang === 'en') {
            window.location.href = 'index-en.html';
        } else if (lang === 'ko') {
            window.location.href = 'index-ko.html';
        }
    });
});

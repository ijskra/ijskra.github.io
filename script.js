

document.addEventListener('DOMContentLoaded', function() {
    // ... (keep your existing code)

    // Read More functionality
    const readMoreBtn = document.getElementById('read-more-btn');
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

    // Load bio content
    fetch('bio.html')
        .then(response => response.text())
        .then(data => {
            bioContent.innerHTML = data;
            bioContent.style.display = 'none';
        })
        .catch(error => console.error('Error loading bio:', error));
});


document.addEventListener('DOMContentLoaded', function() {
    // ... (keep your existing code)

    // Dynamic project generation
    const projectGrid = document.getElementById('project-grid');

    function createProjectElement(project) {
        const projectElement = document.createElement('div');
        projectElement.className = 'project';
        projectElement.dataset.tags = project.tags.map(tag => `#${tag}`).join(' ');

        projectElement.innerHTML = `
            <img src="${project.imageUrl}" alt="${project.title}">
            <div class="project-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <p class="project-tags">
                    ${project.tags.map(tag => `<span class="hashtag">#${tag}</span>`).join(' ')}
                </p>
                <a href="${project.link}" class="btn">View Project</a>
            </div>
        `;

        return projectElement;
    }

    function renderProjects(projects) {
        projectGrid.innerHTML = '';
        projects.forEach(project => {
            projectGrid.appendChild(createProjectElement(project));
        });
    }

    renderProjects(projectsData);

    // Project search functionality
    const projectSearch = document.getElementById('project-search');

    projectSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();

        const filteredProjects = projectsData.filter(project => 
            searchTerm === '' || project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );

        renderProjects(filteredProjects);
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // ... (keep your existing code for projects)

    // Dynamic event generation
    const eventGrid = document.getElementById('event-grid');

    function createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';

        eventElement.innerHTML = `
            <h3>${event.title}</h3>
            <p class="event-date">Date: ${event.date}</p>
            <p class="event-location">Location: ${event.location}</p>
            <p class="event-description">${event.description}</p>
            <a href="${event.link}" class="event-link">More Info</a>
        `;

        return eventElement;
    }

    function renderEvents(events) {
        eventGrid.innerHTML = '';
        events.forEach(event => {
            eventGrid.appendChild(createEventElement(event));
        });
    }

    renderEvents(eventsData);

    // ... (keep your existing code for read more functionality)
});
